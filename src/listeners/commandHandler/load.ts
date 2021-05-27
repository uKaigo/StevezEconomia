import { StevezBot } from '@/bot'
import { Command, Listener } from 'discord-akairo'

export default class CommandLoadListener extends Listener {
  declare client: StevezBot

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
