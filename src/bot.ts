import { AkairoClient, CommandHandler, ListenerHandler } from 'discord-akairo'
import { join } from 'path'
import { owners, prefix } from './config'
import { Logger } from './utils/logger'
import mongoose from 'mongoose'

export class StevezBot extends AkairoClient {
  listenerHandler: ListenerHandler
  commandHandler: CommandHandler
  logger: Logger
  mongoConnection: mongoose.Connection

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

    // Database
    this.mongoConnection = mongoose.connection

    this.registerDbEvents()

    this.startDatabase()
  }

  private async registerDbEvents () {
    this.mongoConnection.once('open', () => {
      this.logger.info('Database conectada.')
    })

    this.mongoConnection.on(
      'error',
      this.logger.error.bind(this.logger, 'Erro no database:\n')
    )
  }

  private async startDatabase () {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    } catch (e) {
      this.logger.error(`Falha ao conectar ao MongoDB: ${e}`)
    }
  }
}
