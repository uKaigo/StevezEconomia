import { Command } from 'discord-akairo'
import { Message } from 'discord.js'

export default class PingCommands extends Command {
  constructor () {
    super('ping', {
      aliases: ['ping']
    })
  }

  exec (message: Message) {
    return message.channel.send('Pong!')
  }
}
