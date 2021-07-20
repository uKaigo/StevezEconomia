import { StevezBot } from '@/bot'
import { promptUser, formatMoney } from '@utils/functions'
import { Settings } from '@utils/enums'
import { Command } from 'discord-akairo'
import {
  Message,
  MessageEmbed,
  User,
  GuildMember,
  TextChannel,
  NewsChannel,
  DMChannel
} from 'discord.js'
import { UserModel } from '@schemas/User'

interface ProfileArgs {
  member: GuildMember
}

export default class ProfileCommand extends Command {
  declare client: StevezBot

  constructor () {
    super('profile', {
      aliases: ['profile', 'perfil'],
      args: [
        {
          id: 'member',
          type: 'member',
          default: (message: Message) => message.member
        }
      ]
    })
  }

  async createProfile (
    user: User,
    channel: TextChannel | NewsChannel | DMChannel
  ) {
    let settings = 0

    let message = await channel.send(
      'Você deseja exibir suas estatísticas (vitórias e derrotas)?'
    )
    let response = await promptUser(message, user)
    settings |= response ? Settings.STATISTICS : 0

    await message.reactions.removeAll()

    await message.edit('Você deseja exibir suas medalhas?')
    response = await promptUser(message, user)
    settings |= response ? Settings.MEDALS : 0

    await message.delete()

    return await new UserModel({ _id: user.id, settings }).save()
  }

  async exec (message: Message, args: ProfileArgs) {
    const member = args.member
    let doc = await UserModel.findOne({ _id: member.id })
    if (!doc) {
      if (message.author.id === member.id) {
        const msg = await message.channel.send(
          'Você não tem um perfil. Deseja criar um?'
        )
        const response = await promptUser(msg, message.author)

        if (!response) {
          return await msg.edit('Ok. Cancelando.')
        } else {
          await msg.delete()
          doc = await this.createProfile(message.author, message.channel)
        }
      } else {
        return await message.channel.send('Este membro não possui um perfil.')
      }
    }

    let stats: string
    if (doc.settings & Settings.STATISTICS) {
      const lostGames = doc.gamesPlayed - doc.gamesWon
      const vd = (doc.gamesWon / Math.max(lostGames, 1)).toLocaleString(
        'pt-BR',
        {
          maximumFractionDigits: 2
        }
      )

      stats =
        `Jogos ganhos: **${doc.gamesWon}**\n` +
        `Jogos perdidos: **${lostGames}**\n` +
        `Vitórias/Derrotas: **${vd}**`
    } else {
      stats = 'O usuário preferiu esconder.'
    }

    let medals: string | undefined
    if (doc.settings & Settings.MEDALS) {
      const emojis = ['🎖', '🏅', '🥉', '🥈', '🥇']
      const index = Math.min(Math.floor(doc.gamesWon / 100), emojis.length)
      medals = emojis
        .slice(0, index)
        .reverse()
        .join(' ')
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Perfil de ${member.user.tag}:`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setColor(member.displayColor)
      .addField('💰 Dinheiro:', formatMoney(doc.balance) + '\n\u200b', false)
      .addField('📊 Estatísticas:', stats, false)

    if (medals) {
      embed.setDescription(medals + '\n\u200b')
    }

    await message.channel.send(embed)
  }
}
