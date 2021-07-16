import { promptUser } from '@utils/functions'
import { UserModel } from '@schemas/User'
import { Command } from 'discord-akairo'
import { GuildMember, Message, User } from 'discord.js'

interface CoinflipArgs {
  choice: 'cara' | 'coroa'
  opponent: GuildMember
}

export default class CoinflipCommand extends Command {
  activePrompts: Set<string>

  constructor () {
    super('coinflip', {
      aliases: ['coinflip'],
      args: [
        {
          id: 'choice',
          type: ['cara', 'coroa'],
          prompt: {
            start: 'Você deseja ser `cara` ou `coroa`?',
            retry: 'Escolha entre `cara` e `coroa`.'
          }
        },
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

    this.activePrompts = new Set()
  }

  getCantPlayText (author: User, opponent: GuildMember) {
    if (opponent.user.bot) {
      return 'Você não pode jogar contra um bot.'
    }

    if (opponent.id === author.id) {
      return 'Você não pode jogar com você mesmo.'
    }

    if (this.activePrompts.has(opponent.id)) {
      return `${opponent.displayName} já está sendo desafiado.`
    }

    return null
  }

  async exec (message: Message, args: CoinflipArgs) {
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

    if (playerDoc.balance < 250) {
      return await message.channel.send('Você não tem dinheiro suficiente.')
    }

    const opponentDoc = await UserModel.findOne({ _id: opponent.id })
    if (!opponentDoc) {
      return await message.channel.send(
        `${opponent.displayName} não tem um perfil.`
      )
    }

    if (opponentDoc.balance < 250) {
      return await message.channel.send(
        'Seu oponente não tem dinheiro suficiente.'
      )
    }

    const gameMessage = await message.channel.send(
      `${opponent}, você deseja jogar cara ou coroa com ${message.author}?\n ` +
        'Será removido **250** coins de cada um, e o ganhador recebe **500** ' +
        '(com uma taxa de 10%).',
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

    await playerDoc.updateOne({ $inc: { balance: -250, gamesPlayed: 1 } })
    await opponentDoc.updateOne({ $inc: { balance: -250, gamesPlayed: 1 } })

    const winner = Math.random() < 0.5 ? 'cara' : 'coroa'

    const toAdd = 500 - 500 * 0.1 // 10% para o bot (50)
    if (args.choice === winner) {
      await playerDoc.updateOne({ $inc: { balance: toAdd, gamesWon: 1 } })
      return await gameMessage.edit(
        `${message.author} ganhou! ${toAdd} coins foram adicionados.`
      )
    } else {
      await opponentDoc.updateOne({ $inc: { balance: toAdd, gamesWon: 1 } })
      return await gameMessage.edit(
        `${opponent} ganhou! ${toAdd} coins foram adicionados.`
      )
    }
  }
}
