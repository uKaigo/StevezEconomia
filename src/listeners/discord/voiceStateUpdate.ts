import { Listener } from 'discord-akairo'
import { VoiceState } from 'discord.js'
import { promisify } from 'util'
import { UserModel } from '@schemas/User'
import EventEmitter from 'events'

interface MemberWatcher {
  on(event: 'tick', listener: (id: string) => void): this
  on(event: 'stop', listener: (id: string) => void): this
}

class MemberWatcher extends EventEmitter {
  state: VoiceState
  accumulator: number
  private rejectPromise: Function | null

  constructor (state: VoiceState) {
    super()
    this.state = state
    this.accumulator = 0
    this.rejectPromise = null
  }

  stop () {
    while (!this.rejectPromise) {}
    this.rejectPromise()
  }

  sleep () {
    return new Promise((resolve, reject) => {
      this.rejectPromise = reject
      setTimeout(resolve, 3.6e6) // 1 hora
    })
  }

  async watch () {
    while (this.accumulator !== 12) {
      try {
        await this.sleep()
      } catch {
        // Isso só vai executar quando for cancelado.
        break
      }

      this.rejectPromise = null

      this.accumulator++

      if (!this.state.selfMute && !this.state.serverMute) {
        this.emit('tick', this.state.member!.id)
      }
    }

    this.emit('stop', this.state.member!.id)
  }
}

export default class VoiceStateUpdateListener extends Listener {
  watchers: { [id: string]: MemberWatcher }

  constructor () {
    super('voiceStateUpdate', {
      emitter: 'client',
      event: 'voiceStateUpdate'
    })

    this.watchers = {}
  }

  exec (oldState: VoiceState, newState: VoiceState) {
    if (!oldState.member?.id || !newState.member?.id) {
      return // cursed
    }

    if (!oldState.channelID && newState.channelID) {
      // Entrou no canal
      // Incomum, mas pode acontecer caso o evento de disconnect não chegue.
      if (newState.member.id in this.watchers) {
        this.watchers[newState.member.id].stop()
      }

      const watcher = new MemberWatcher(newState)
      this.watchers[newState.member.id] = watcher

      watcher
        .on('tick', async id => {
          await UserModel.findOneAndUpdate(
            { _id: id },
            { $inc: { balance: 100 } },
            { upsert: true, new: true, useFindAndModify: false }
          )
        })
        .on('stop', id => {
          delete this.watchers[id]
        })

        .watch()
    } else if (!this.watchers[newState.member.id]) {
      return
    } else if (!newState.channelID && oldState.channelID) {
      this.watchers[newState.member.id].stop()
    } else {
      this.watchers[newState.member.id].state = newState
    }
  }
}
