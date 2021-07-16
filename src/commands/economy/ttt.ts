import { promptUser } from '@utils/functions'
import { UserModel } from '@schemas/User'
import { embedColor } from '@config'
import { Players, TicTacToe } from '@games/ticTacToe'
import { Command } from 'discord-akairo'
import {
  ClientUser,
  GuildMember,
  Message,
  MessageEmbed,
  MessageReaction,
  User
} from 'discord.js'

interface GameInfo {
  message: Message
  players: GuildMember[]
  game: TicTacToe
}

interface TTTArgs {
  opponent: GuildMember
}

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
const PLAYERS = ['❌', '⭕']
const GRID = `
00❕11❕22
➖➕➖➕➖
33❕⁣44❕55
➖➕➖➕➖
66❕77❕88
`

export default class TTTCommand extends Command {
  activeGames: { [id: string]: GameInfo }
  activePrompts: Set<string>

  constructor () {
    super('ttt', {
      aliases: ['ttt'],

      args: [
        {
          id: 'opponent',
          type: 'member',
          prompt: {
            start: 'Com quem você deseja jogar?',
            retry: 'Não foi possível encontrar esse membro.'
          }
        }
      ]
    })

    this.activeGames = {}
    this.activePrompts = new Set()
  }

  getCantPlayText (author: User, opponent: GuildMember) {
    if (opponent.user.bot) {
      return 'Você não pode jogar contra um bot.'
    }

    if (opponent.id === author.id) {
      return 'Você não pode jogar com você mesmo.'
    }

    if (author.id in this.activeGames) {
      return 'Você já está em um jogo.'
    }

    if (
      opponent.id in this.activeGames ||
      this.activePrompts.has(opponent.id)
    ) {
      return `${opponent.displayName} já está em um jogo.`
    }

    return null
  }

  async exec (message: Message, args: TTTArgs) {
    const opponent = args.opponent

    const cantPlayText = this.getCantPlayText(message.author, opponent)
    if (cantPlayText) {
      return await message.channel.send(cantPlayText)
    }

    const playerDoc = await UserModel.findOne({ _id: message.author.id })
    if (!playerDoc) {
      return await message.channel.send(
        'Você não tem um perfil. Use `!profile` e tente novamente.'
      )
    }

    if (playerDoc.balance < 15) {
      return await message.channel.send('Você não tem dinheiro suficiente.')
    }

    const opponentDoc = await UserModel.findOne({ _id: opponent.id })
    if (!opponentDoc) {
      return await message.channel.send(
        `${opponent.displayName} não tem um perfil.`
      )
    }

    if (opponentDoc.balance < 15) {
      return await message.channel.send(
        'Seu oponente não tem dinheiro suficiente.'
      )
    }

    const gameMessage = await message.channel.send(
      `${opponent}, você deseja jogar jogo da velha com ${message.author}?\n ` +
        'Será removido **15** coins de cada um, e o ganhador recebe **30**.',
      {
        allowedMentions: { parse: ['users'] }
      }
    )

    this.activePrompts.add(opponent.id)
    const response = await promptUser(gameMessage, opponent)
    if (!response) {
      this.activePrompts.delete(opponent.id)
      return await gameMessage.edit(`${opponent} cancelou.`)
    }

    await playerDoc.updateOne({ $inc: { balance: -100, gamesPlayed: 1 } })
    await opponentDoc.updateOne({ $inc: { balance: -100, gamesPlayed: 1 } })

    const game = new TicTacToe()

    const info: GameInfo = {
      message: gameMessage,
      players: [message.member!, opponent],
      game
    }

    this.activeGames[message.author.id] = info
    this.activeGames[opponent.id] = info

    this.updateReactions(info)
    this.loop(info)
    return await this.updateMessage(info)
  }

  async updateReactions (info: GameInfo) {
    for (const move of info.game.validMoves) {
      await info.message.react(EMOJIS[move - 1])
    }
  }

  async updateMessage (info: GameInfo) {
    // Formatação do GRID
    let table = GRID

    const emojis = EMOJIS.map((value, index) => {
      if (info.game.getSquare(index) !== Players.UNSET) {
        return PLAYERS[info.game.getSquare(index)]
      }
      return value
    })

    for (let k = 0; k < 10; k++) {
      table = table.replace(`${k}${k}`, emojis[k])
    }

    // Atualização

    const embed = new MessageEmbed({
      title: 'Jogo da velha',
      color: embedColor
    })
    embed.description = table

    let gameStatus: string
    if (info.game.winner === null) {
      const turn = info.players[info.game.turn]
      gameStatus = `Vez de: ${turn}`
    } else if (info.game.winner === Players.UNSET) {
      gameStatus = 'Deu velha!'
    } else {
      gameStatus = `${info.players[info.game.winner]} ganhou!`
    }

    embed.description += `\n${gameStatus}`
    await info.message.edit({ content: null, embed })
  }

  getCheck (info: GameInfo) {
    const player = info.players[info.game.turn]

    return (reaction: MessageReaction, user: User | ClientUser) => {
      return (
        reaction.message.id === info.message.id &&
        user.id === player.id &&
        EMOJIS.includes(reaction.emoji.name)
      )
    }
  }

  async loop (info: GameInfo) {
    const message = info.message

    while (info.game.winner === null) {
      let collected

      try {
        collected = await message.awaitReactions(this.getCheck(info), {
          max: 1,
          time: 30000,
          errors: ['time']
        })
      } catch {
        await info.message.edit({ content: 'Tempo excedido.', embed: null })
        break
      }
      const reaction = collected.first()

      try {
        info.game.makeMove(EMOJIS.indexOf(reaction?.emoji.name as string))
      } catch {
        continue
      }

      this.updateMessage(info)
    }

    if (info.game.winner !== Players.UNSET) {
      await this.rewardWinner(info.players[info.game.winner!])
    }

    await info.message.reactions.removeAll()
    info.players.forEach(player => delete this.activeGames[player.id])
  }

  async rewardWinner (player: GuildMember) {
    const toAdd = 200 - 200 * 0.1 // 10% para o bot (20)
    await UserModel.updateOne(
      { _id: player.id },
      { $inc: { balance: toAdd, gamesWon: 1 } }
    )
  }
}
