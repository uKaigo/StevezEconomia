import { StevezBot } from '@/bot'
import { Command } from 'discord-akairo'
import { Message } from 'discord.js'

export default class PingCommand extends Command {
  declare client: StevezBot

  constructor () {
    super('ping', {
      aliases: ['ping']
    })
  }

  async exec (message: Message) {
    const start = Date.now()
    await this.client.mongoConnection.db.admin().ping()
    const dbPing = Math.round(Date.now() - start)

    return await message.channel.send(
      `🏓 Pong!\n- Websocket: ${this.client.ws.ping}ms\n- Database: ${dbPing}ms`
    )
  }
}
