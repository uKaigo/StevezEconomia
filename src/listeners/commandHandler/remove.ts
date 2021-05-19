import { Command, Listener } from 'discord-akairo'
import { StevezBot } from '@/bot'

export default class CommandRemoveListener extends Listener {
  client!: StevezBot

  constructor () {
    super('commandRemove', {
      emitter: 'commandHandler',
      event: 'remove'
    })
  }

  exec (command: Command) {
    this.client.logger.debug(`Comando "${command.id}" removido.`)
  }
}
