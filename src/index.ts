import { StevezBot } from './bot'

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ debug: true })
  require('mongoose').set('debug', true)
}

const client = new StevezBot()
client.login(process.env.DISCORD_TOKEN)
