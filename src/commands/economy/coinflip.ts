import { UserModel } from '@/schemas/User'
import { Command } from 'discord-akairo'
import {
  ClientUser,
  GuildMember,
  Message,
  MessageReaction,
  User
} from 'discord.js'

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

  async promptOpponent (message: Message, opponent: GuildMember) {
    this.activePrompts.add(opponent.id)

    await message.react('✅')
    await message.react('❌')

    let collected
    try {
      collected = await message.awaitReactions(
        (reaction: MessageReaction, user: User | ClientUser) => {
          return (
            reaction.message.id === message.id &&
            ['✅', '❌'].includes(reaction.emoji.name) &&
            user.id == opponent.user.id
          )
        },
        {
          max: 1,
          time: 30000,
          errors: ['time']
        }
      )
    } catch {
      await message.edit({ content: 'Tempo excedido.', embed: null })
      return false
    } finally {
      this.activePrompts.delete(opponent.id)
    }

    const reaction = collected.first()
    if (reaction?.emoji.name === '❌') {
      await message.edit({ content: `${opponent} cancelou.`, embed: null })
      return false
    }

    return true
  }

  async exec (message: Message, args: CoinflipArgs) {
    const opponent = args.opponent

    const cantPlayText = this.getCantPlayText(message.author, opponent)
    if (cantPlayText) {
      return await message.channel.send(cantPlayText)
    }

    let playerDoc = await UserModel.findOne({ _id: message.author.id })
    let opponentDoc = await UserModel.findOne({ _id: opponent.id })

    if (!playerDoc) {
      playerDoc = new UserModel({ _id: message.author.id })
      await playerDoc.save()
    }
    if (!opponentDoc) {
      opponentDoc = new UserModel({ _id: opponent.id })
      await opponentDoc.save()
    }

    if (playerDoc.balance < 250) {
      return await message.channel.send('Você não tem dinheiro suficiente.')
    }

    if (opponentDoc.balance < 250) {
      return await message.channel.send(
        'Seu oponente não tem dinheiro suficiente.'
      )
    }

    const gameMessage = await message.channel.send(
      `${opponent}, você deseja jogar cara ou coroa com ${message.author}?\n ` +
        'Será removido **15** coins de cada um, e o ganhador recebe **30**.',
      {
        allowedMentions: { parse: ['users'] }
      }
    )

    const response = await this.promptOpponent(gameMessage, opponent)
    if (response === false) {
      return
    }

    await playerDoc.updateOne({ $inc: { balance: -250 } })
    await opponentDoc.updateOne({ $inc: { balance: -250 } })

    const winner = Math.random() < 0.5 ? 'cara' : 'coroa'

    const toAdd = 500 - 500 * 0.1 // 10% para o bot (50)
    if (args.choice === winner) {
      await playerDoc.updateOne({ $inc: { balance: toAdd } })
      return await gameMessage.edit(
        `${message.author} ganhou! ${toAdd} coins foram adicionados.`
      )
    } else {
      await opponentDoc.updateOne({ $inc: { balance: toAdd } })
      return await gameMessage.edit(
        `${opponent} ganhou! ${toAdd} coins foram adicionados.`
      )
    }
  }
}
