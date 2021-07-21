import { Command } from 'discord-akairo'
import { ItemModel } from '@schemas/StoreItem'
import { formatMoney } from '@utils/functions'
import { Message, MessageEmbed } from 'discord.js'

export default class LojaCommand extends Command {
  constructor () {
    super('loja', {
      aliases: ['loja', 'store']
    })
  }

  async exec (message: Message) {
    const items = await ItemModel.find({})

    const embed = new MessageEmbed()
      .setTitle('Loja')
      .setFooter('Utilize `!comprar [id]` para comprar um item.')

    for (const item of items) {
      embed.addField(
        `[${item._id}] ${item.name}`,
        `${item.description}\n> Preço: ${formatMoney(item.price)}`
      )
    }

    await message.channel.send(embed)
  }
}
