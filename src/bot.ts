import { AkairoClient, CommandHandler, ListenerHandler } from 'discord-akairo'
import { owners, prefix } from './config'
import { Logger } from './utils/logger'
import { join } from 'path'

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
        allowedMentions: {}
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

    this.listenerHandler.loadAll()
    this.commandHandler.loadAll()

    this.logger = new Logger()
  }
}
