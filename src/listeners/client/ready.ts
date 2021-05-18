import { Listener } from 'discord-akairo'

export default class ReadyListener extends Listener {
  constructor () {
    super('clientReady', {
      emitter: 'client',
      event: 'ready',
      type: 'once'
    })
  }

  exec () {
    console.log(`Logado como: ${this.client.user!.tag}`)
  }
}
