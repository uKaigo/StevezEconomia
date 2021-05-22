import { AkairoClient, CommandHandler, ListenerHandler } from 'discord-akairo'
import { join } from 'path'
import { owners, prefix } from './config'
import { Logger } from './utils/logger'

export class StevezBot extends AkairoClient {
  listenerHandler: ListenerHandler
  commandHandler: CommandHandler
  logger: Logger

  constructor () {
    super(
      // discord-akairo options
      {
        ownerID: owners
      },
      // discord.js options
      {
        messageCacheMaxSize: 1000,
        restTimeOffset: 10,
        allowedMentions: {
          parse: []
        }
      }
    )

    this.commandHandler = new CommandHandler(this, {
      prefix: prefix,
      directory: join(__dirname, './commands/')
    })

    this.listenerHandler = new ListenerHandler(this, {
      automateCategories: true,
      directory: join(__dirname, './listeners/')
    })

    this.commandHandler.useListenerHandler(this.listenerHandler)
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      listenerHandler: this.listenerHandler
    })

    this.logger = new Logger()

    this.listenerHandler.loadAll()
    this.commandHandler.loadAll()
  }
}
