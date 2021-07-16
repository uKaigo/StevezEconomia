import { StevezBot } from '@/bot'
import { Command } from 'discord-akairo'
import { Message, MessageEmbed, GuildMember } from 'discord.js'
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

  async exec (message: Message, args: ProfileArgs) {
    const member = args.member
    const doc = await UserModel.findOne({ _id: member.id })
    if (!doc) {
      return await message.channel.send('Este membro não possui um perfil.')
    }

    const money = doc.balance.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol'
    })

    const lostGames = doc.gamesPlayed - doc.gamesWon
    const vd = (doc.gamesWon / Math.max(lostGames, 1)).toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    })

    const stats =
      `Jogos ganhos: **${doc.gamesWon}**\n` +
      `Jogos perdidos: **${lostGames}**\n` +
      `Vitórias/Derrotas: **${vd}**`

    const embed = new MessageEmbed()
      .setAuthor(
        `Perfil de ${member.user.tag}:`,
        member.user.avatarURL() || member.user.defaultAvatarURL
      )
      .setColor(member.displayColor)
      .addField('💰 Dinheiro:', money + '\n\u200b', false)
      .addField('📊 Estatísticas:', stats, false)

    await message.channel.send(embed)
  }
}
