import { StevezBot } from '@/bot'
import { Listener } from 'discord-akairo'

export default class ListenerRemoveListener extends Listener {
  client!: StevezBot

  constructor () {
    super('listenerRemove', {
      emitter: 'listenerHandler',
      event: 'remove'
    })
  }

  exec (listener: Listener) {
    this.client.logger.debug(`Listener "${listener.id}" removido.`)
  }
}
