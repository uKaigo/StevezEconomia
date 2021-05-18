import { StevezBot } from './bot'
import { config as config_dotenv } from 'dotenv'

config_dotenv({ debug: process.env.NODE_ENV !== 'production' })

const client = new StevezBot()
client.login(process.env.DISCORD_TOKEN)
