import { Command, Listener } from 'discord-akairo'
import { StevezBot } from '@/bot'

export default class CommandLoadListener extends Listener {
  client!: StevezBot

  constructor () {
    super('commandLoad', {
      emitter: 'commandHandler',
      event: 'load'
    })
  }

  exec (command: Command, isReload: boolean) {
    const re = isReload ? 're' : ''
    this.client.logger.debug(`Comando "${command.id}" ${re}carregado.`)
  }
}
