import { StevezBot } from '@/bot'
import { Listener } from 'discord-akairo'
import { BetModel, SenaModel } from '@schemas/MegaSena'
import { UserModel } from '@schemas/User'
import { getUtcTimestamp, randint } from '@utils/functions'
import { megasenaChannel } from '@config'
import { TextChannel } from 'discord.js'

export default class ReadyListener extends Listener {
  declare client: StevezBot

  constructor () {
    super('clientReady', {
      emitter: 'client',
      event: 'ready',
      type: 'once'
    })
  }

  async runSena () {
    while (this.client.mongoConnection.readyState !== 1) {}

    const doc = await SenaModel.findOne({ _id: 'megasena' })
    if (!doc) {
      this.client.logger.error('Documento megasena não encontrado.')
      return
    }

    if (getUtcTimestamp() - doc.startDate > 3 * 86400) {
      // Dia de megasena
      const winners = await BetModel.find({ numbers: doc.rewardedNumbers })

      const channel = this.client.channels.cache.get(
        megasenaChannel
      ) as TextChannel

      const sDate = new Date(doc.startDate)
      const date = [sDate.getDay(), sDate.getMonth(), sDate.getFullYear()]
        .map(d => String(d).padStart(2, '0'))
        .join('/')

      const prize = doc.accumulatedPrize

      if (winners.length) {
        const toGive = Math.floor(doc.accumulatedPrize / winners.length)

        for (const winner of winners) {
          await UserModel.updateOne(
            { _id: winner._id },
            { $inc: { balance: toGive } }
          )
        }

        const winnersFmt = winners.map(w => `- <@${w._id}>`).join('\n')

        await channel.send(
          `Os ganhadores da megasena do dia **${date}** ` +
            `com o valor de **$${prize}** foram:\n\n` +
            winnersFmt +
            '\n\n> Use `!megasena [valor] [6 numeros]` para apostar para a próxima!'
        )
      } else {
        await channel.send(
          `Infelizmente ninguém ganhou o valor de **$${prize}** da megasena` +
            `do dia **${date}**.\n\n` +
            '> Use `!megasena [valor] [6 numeros]` para apostar para a próxima!'
        )
      }

      await doc.delete()

      const numbers = Array.from({ length: 6 }, () => randint(1, 61))

      await new SenaModel({
        rewardedNumbers: numbers,
        startDate: getUtcTimestamp()
      }).save()
    } else {
      setTimeout(
        this.runSena.bind(this),
        (getUtcTimestamp() - doc.startDate) * 1000
      )
    }
  }

  exec () {
    this.runSena()
    this.client.logger.info(`Logado como: ${this.client.user?.tag}`)
  }
}
