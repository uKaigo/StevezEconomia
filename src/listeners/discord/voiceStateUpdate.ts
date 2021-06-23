import { Listener } from 'discord-akairo'
import { VoiceState } from 'discord.js'
import { UserModel } from '@schemas/User'
import { StevezBot } from '@/bot'
import { getUtcTimestamp } from '@utils/functions'
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
    this.rejectPromise('CANCELANDO')
  }

  sleep (time: number) {
    return new Promise((resolve, reject) => {
      this.rejectPromise = reject
      setTimeout(resolve, time)
    })
  }

  async watch () {
    while (this.accumulator !== 12) {
      try {
        // await this.sleep(3.6e6) // 1 hora
        await this.sleep(5000)
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
  declare client: StevezBot
  watchers: { [id: string]: MemberWatcher }

  constructor () {
    super('voiceStateUpdate', {
      emitter: 'client',
      event: 'voiceStateUpdate'
    })

    this.watchers = {}
  }

  registerWatcherEvents (watcher: MemberWatcher) {
    watcher
      .on('tick', async id => {
        await UserModel.updateOne(
          { _id: id },
          {
            $inc: { balance: 100 },
            $set: {
              voiceXpAccumulator: this.watchers[id].accumulator,
              lastVoiceXp: getUtcTimestamp()
            }
          }
        )
      })

      .on('stop', async id => {
        delete this.watchers[id]
      })
  }

  async exec (oldState: VoiceState, newState: VoiceState) {
    if (!oldState.member?.id || !newState.member?.id) return // cursed

    if (!oldState.channelID && newState.channelID) {
      // Entrou no canal
      // Incomum, mas pode acontecer caso o evento de disconnect não chegue.
      if (newState.member.id in this.watchers) {
        this.watchers[newState.member.id].stop()
      }

      const watcher = new MemberWatcher(newState)

      const userData = await UserModel.findOne({ _id: newState.member.id })
      if (userData) {
        if (getUtcTimestamp() - userData.lastVoiceXp < 86400) {
          watcher.accumulator = userData.voiceXpAccumulator
        }

        if (watcher.accumulator === 12) return
      } else {
        await new UserModel({ _id: newState.member.id }).save()
      }

      this.watchers[newState.member.id] = watcher

      this.registerWatcherEvents(watcher)

      const logger = this.client.logger
      watcher
        .watch()
        .catch(logger.error.bind(logger, `(${newState.member.id} WATCHER)`))
    } else if (!this.watchers[newState.member.id]) {
      return
    } else if (!newState.channelID && oldState.channelID) {
      this.watchers[newState.member.id].stop()
    } else {
      this.watchers[newState.member.id].state = newState
    }
  }
}
