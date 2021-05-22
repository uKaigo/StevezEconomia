import { StevezBot } from '@/bot'
import { Listener } from 'discord-akairo'

export default class ListenerLoadListener extends Listener {
  client!: StevezBot

  constructor () {
    super('listenerLoad', {
      emitter: 'listenerHandler',
      event: 'load'
    })
  }

  exec (listener: Listener, isReload: boolean) {
    const re = isReload ? 're' : ''
    this.client.logger.debug(`Listener "${listener.id}" ${re}carregado.`)
  }
}
