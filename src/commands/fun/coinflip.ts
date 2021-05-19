import { Command } from 'discord-akairo'
import { Message } from 'discord.js'

interface CoinflipArgs {
  choice: string
}

export default class CoinflipCommand extends Command {
  constructor () {
    super('coinflip', {
      aliases: ['coinflip'],
      args: [
        {
          id: 'choice',
          type: ['cara', 'coroa'],
          prompt: {
            start: 'Você deseja ser `cara` ou `coroa`?',
            retry: 'Escolha entre `cara` e `coroa`.\nTente novamente.'
          }
        }
      ]
    })
  }

  exec (message: Message, args: CoinflipArgs) {
    const result = Math.round(Math.random())
    const winner = result === 0 ? 'cara' : 'coroa'

    if (args.choice === winner) {
      return message.channel.send('Você ganhou!')
    } else {
      return message.channel.send('Eu ganhei!')
    }
  }
}
