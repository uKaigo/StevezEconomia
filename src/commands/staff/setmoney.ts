import { Command } from 'discord-akairo'
import { GuildMember, Message } from 'discord.js'
import { UserModel } from '@schemas/User'
import { formatMoney } from '@utils/functions'
import { promptUser } from '@utils/functions'

interface SetmoneyArgs {
  member: GuildMember
  balance: number
}

export default class SetmoneyCommand extends Command {
  constructor () {
    super('setmoney', {
      aliases: ['setmoney', 'setbal'],
      args: [
        {
          id: 'member',
          type: 'member',
          prompt: {
            start: 'Que membro você deseja alterar?',
            retry: 'Membro não encontrado.'
          }
        },
        {
          id: 'balance',
          type: 'number',
          prompt: {
            start: 'Qual será o novo saldo do membro?',
            retry: 'Informe um valor.'
          }
        }
      ]
    })
  }

  async exec (message: Message, args: SetmoneyArgs) {
    // TODO: Checar permissões
    const doc = await UserModel.findOne({ _id: args.member.id })
    if (!doc) {
      return await message.channel.send(`${args.member} não tem um perfil.`)
    }

    const msg = await message.channel.send(
      `Alterar o saldo de ${args.member} para ${formatMoney(doc.balance)} ` +
        ` → ${formatMoney(args.balance)}?`
    )

    const res = await promptUser(msg, message.author)
    if (!res) {
      return await msg.edit('Ok. Cancelando.')
    }

    await doc.updateOne({ balance: args.balance })

    await msg.edit(`Saldo de ${args.member} alterado.`)
  }
}
