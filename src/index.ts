import { config as config_dotenv } from 'dotenv'
import { set as mongoose_set } from 'mongoose'
import { StevezBot } from './bot'

if (process.env.NODE_ENV !== 'production') {
  mongoose_set('debug', true)
}
config_dotenv({ debug: process.env.NODE_ENV !== 'production' })

const client = new StevezBot()
client.login(process.env.DISCORD_TOKEN)
