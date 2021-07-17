import { StevezBot } from '@/bot'
import { Command } from 'discord-akairo'
import { UserModel } from '@schemas/User'
import { Settings } from '@utils/enums'
import {
  Message,
  MessageEmbed,
  MessageReaction,
  User,
  ClientUser
} from 'discord.js'

export default class SettingsCommand extends Command {
  declare client: StevezBot

  constructor () {
    super('settings', {
      aliases: ['settings']
    })
  }

  async getSelectedSetting (message: Message, member: User) {
    await message.react('🏆')
    await message.react('🏅')

    let collected
    try {
      collected = await message.awaitReactions(
        (reaction: MessageReaction, user: User | ClientUser) => {
          return (
            reaction.message.id === message.id &&
            ['🏆', '🏅'].includes(reaction.emoji.name) &&
            user.id == member.id
          )
        },
        {
          max: 1,
          time: 30000,
          errors: ['time']
        }
      )
    } catch {
      return 0
    }

    const reaction = collected.first()

    if (reaction?.emoji.name === '🏆') {
      return Settings.STATISTICS
    }
    if (reaction?.emoji.name === '🏅') {
      return Settings.MEDALS
    }

    return 0
  }

  async exec (message: Message) {
    const doc = await UserModel.findOne({ _id: message.author.id })
    if (!doc) {
      return await message.channel.send(
        'Você não tem um perfil. Execute `!profile` para criar um.'
      )
    }

    const SE = (doc.settings & Settings.STATISTICS) !== 0
    const ME = (doc.settings & Settings.MEDALS) !== 0

    const description =
      `Reaja com 🏆 para ${SE ? 'não' : ''} exibir vitórias e derrotas.\n` +
      `Reaja com 🏅 para ${ME ? 'não' : ''} exibir medalhas.\n\n`

    const embed = new MessageEmbed()
      .setTitle('Configurações')
      .setDescription(description)

    const msg = await message.channel.send(embed)

    const setting = await this.getSelectedSetting(msg, message.author)

    await msg.reactions.removeAll()

    if (setting !== 0) {
      await doc.updateOne({ settings: doc.settings ^ setting })
      await msg.edit('Configuração alterada.')
    }
  }
}
