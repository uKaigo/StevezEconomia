import { StevezBot } from '@/bot'
import { Listener } from 'discord-akairo'
import { BetModel, SenaModel } from '@schemas/MegaSena'
import { UserModel } from '@schemas/User'
import { getUtcTimestamp } from '@utils/functions'
import { megasenaChannel } from '@config'
import { TextChannel } from 'discord.js'
import centra from '@aero/centra'

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
    if (this.client.mongoConnection.readyState !== 1) {
      await new Promise((resolve, reject) =>
        this.client.mongoConnection.once('connected', resolve)
      )
    }

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

      // timezones :(
      const sDate = new Date((doc.startDate - 3 * 3600) * 1000)
      const date = [sDate.getDate(), sDate.getMonth() + 1, sDate.getFullYear()]
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
            '\n\n> Use `!megasena [valor] [6 numeros]` para apostar para a próxima!',
          {
            allowedMentions: { parse: ['users'] }
          }
        )
      } else {
        await channel.send(
          `Infelizmente ninguém ganhou o valor de **$${prize}** da megasena ` +
            `do dia **${date}**.\n\n` +
            '> Use `!megasena [valor] [6 numeros]` para apostar para a próxima!'
        )
      }

      await SenaModel.deleteMany({}) // Deletar tudo

      // Gerar 6 números distintos
      const rUrl = 'sequences/?min=1&max=60&col=1&format=plain&rnd=new'
      const res = await centra(`https://www.random.org/${rUrl}`, 'GET')
        .header('X-Powered-By', 'NodeJS | @aero/centra')
        .send()

      const numbers: number[] = res.text
        .trim()
        .split('\n')
        .slice(0, 6)
        .map((n: string) => parseInt(n, 10))

      await new SenaModel({
        rewardedNumbers: numbers.sort((a, b) => a - b),
        startDate: getUtcTimestamp()
      }).save()
    } else {
      const left = 3 * 86400 - (getUtcTimestamp() - doc.startDate)
      // O bot provavelmente vai reiniciar em 24 horas, então não é necessário
      // a espera.
      if (left < 86400) {
        setTimeout(this.runSena.bind(this), left * 1000)
      }
    }
  }

  exec () {
    this.runSena()
    this.client.logger.info(`Logado como: ${this.client.user?.tag}`)
  }
}
