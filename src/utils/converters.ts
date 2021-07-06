import { Message } from 'discord.js'

export function inRange (min: number, max: number) {
  return (message: Message, argument: string) => {
    const number = parseInt(argument, 10)

    if (isNaN(number) || number < min || number > max) {
      return null
    }

    return number
  }
}
