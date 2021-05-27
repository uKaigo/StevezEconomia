import { StevezBot } from '@/bot'
import { Listener } from 'discord-akairo'

export default class ReadyListener extends Listener {
  declare client: StevezBot

  constructor () {
    super('clientReady', {
      emitter: 'client',
      event: 'ready',
      type: 'once'
    })
  }

  exec () {
    this.client.logger.info(`Logado como: ${this.client.user?.tag}`)
  }
}
