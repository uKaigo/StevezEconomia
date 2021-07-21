import { promptUser } from '@utils/functions'
import { Command, Argument } from 'discord-akairo'
import { BetModel, SenaModel } from '@schemas/MegaSena'
import { Message } from 'discord.js'
import { UserModel } from '@schemas/User'

function convertNumbers (message: Message, argument: string) {
  const numberStrings = argument.split(' ')
  if (numberStrings.length !== 6) return null

  // Precisamos passar por uma função, para não passar mais de um valor
  // para o parseInt
  const numbers = numberStrings.map(value => parseInt(value, 10))

  if (numbers.some(value => isNaN(value) || value < 1 || value > 60)) {
    return null
  }

  // Encontrar números duplicados.
  if ([...new Set(numbers)].length !== numbers.length) {
    return null
  }
  numbers.sort((a, b) => a - b)

  return numbers
}

interface MegaSenaArgs {
  numbers: number[]
  amount: number
}

export default class MegaSenaCommand extends Command {
  constructor () {
    super('megasena', {
      aliases: ['megasena'],
      args: [
        {
          id: 'amount',
          type: Argument.range('number', 100, Infinity),
          prompt: {
            start: 'Quanto você deseja apostar?',
            retry: 'Aposte no mínimo $100.'
          }
        },
        {
          id: 'numbers',
          type: convertNumbers,
          match: 'rest',
          limit: 6,
          prompt: {
            start: 'Quais números você deseja jogar?',
            retry: 'Escolha 6 números distintos entre 1 e 60.'
          }
        }
      ]
    })
  }

  async exec (message: Message, args: MegaSenaArgs) {
    const betDoc = await BetModel.findOne({ _id: message.author.id })
    if (betDoc) {
      return await message.channel.send('Você já fez uma aposta!')
    }

    let userDoc = await UserModel.findOne({ _id: message.author.id })

    if (!userDoc) {
      return await message.channel.send(
        'Você não tem um perfil. Use `!profile` e tente novamente.'
      )
    }

    if (userDoc.balance < args.amount) {
      return await message.channel.send(`Você não possui $${args.amount}.`)
    }

    const numbersRepr = args.numbers
      .map(n => n.toString().padStart(2, '0'))
      .join(' ')

    const msg = await message.channel.send(
      `Você deseja apostar $${args.amount} em \`${numbersRepr}\`?`
    )

    const result = await promptUser(msg, message.member!)
    if (!result) {
      return await msg.edit('Ok. Cancelando.')
    }

    await userDoc.updateOne({ $inc: { balance: -args.amount } })

    await new BetModel({
      _id: message.author.id,
      numbers: args.numbers,
      bet: args.amount
    }).save()

    await SenaModel.updateOne(
      { _id: 'megasena' },
      { $inc: { accumulatedPrize: args.amount * 2 } },
      { upsert: true, setDefaultsOnInsert: true }
    )

    return await message.channel.send(
      `$${args.amount} apostado nos números \`${numbersRepr}\``
    )
  }
}
