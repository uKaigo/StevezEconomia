import { Listener } from 'discord-akairo'
import { StevezBot } from '@/bot'

export default class ReadyListener extends Listener {
  client!: StevezBot

  constructor () {
    super('clientReady', {
      emitter: 'client',
      event: 'ready',
      type: 'once'
    })
  }

  exec () {
    this.client.logger.info(`Logado como: ${this.client.user!.tag}`)
  }
}
