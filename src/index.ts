import { config as config_dotenv } from 'dotenv'
import { StevezBot } from './bot'

config_dotenv({ debug: process.env.NODE_ENV !== 'production' })

const client = new StevezBot()
client.login(process.env.DISCORD_TOKEN)
