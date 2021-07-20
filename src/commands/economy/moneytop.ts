import { StevezBot } from '@/bot'
import { Command } from 'discord-akairo'
import { UserModel } from '@schemas/User'
import { formatMoney } from '@utils/functions'
import { Message, MessageEmbed } from 'discord.js'

export default class MoneytopCommand extends Command {
  declare client: StevezBot

  constructor () {
    super('moneytop', {
      aliases: ['moneytop', 'top']
    })
  }

  async exec (message: Message) {
    const topUsers = await UserModel.find({})
      .sort('-balance')
      .limit(10)
      .exec()

    const embed = new MessageEmbed({ title: 'Membros mais ricos:' })
    for (const userDoc of topUsers) {
      const member = this.client.util.resolveMember(
        userDoc._id,
        message.guild!.members.cache
      )

      const memberRepr: string = member ? member.user.tag : userDoc._id

      embed.addField(
        `- ${memberRepr}`,
        `Com ${formatMoney(userDoc.balance)}`,
        false
      )
    }

    await message.channel.send(embed)
  }
}
