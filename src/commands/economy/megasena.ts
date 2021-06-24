import { Command } from 'discord-akairo'
import { Message } from 'discord.js'

const prompStartMap = [
  'primeiro',
  'segundo',
  'terceiro',
  'quarto',
  'quinto',
  'sexto'
]

function convertNumbers (message: Message, argument: string) {
  const numberStrings = argument.split(' ')
  if (numberStrings.length !== 6) return null

  // Precisamos passar por uma função, para não passar mais de um valor
  // para o parseInt
  const numbers = numberStrings.map(value => Number.parseInt(value))

  if (numbers.some(value => isNaN(value) || value < 1 || value > 60)) {
    return null
  }

  // Encontrar números duplicados.
  if ([...new Set(numbers)].length !== numbers.length) {
    return null
  }

  return numbers
}

interface MegaSenaArgs {
  numbers: number[]
}

export default class MegaSenaCommand extends Command {
  constructor () {
    super('megasena', {
      aliases: ['megasena'],
      args: [
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

  exec (message: Message, args: MegaSenaArgs) {
    // TODO
  }
}
