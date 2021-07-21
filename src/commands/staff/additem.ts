import { Command } from 'discord-akairo'
import { Message } from 'discord.js'
import { formatMoney } from '@utils/functions'
import { ItemModel } from '@schemas/StoreItem'
import { promptUser } from '@utils/functions'

interface AdditemArgs {
  _id: number
  price: number
  name: string
  description: string
}

export default class AdditemCommand extends Command {
  constructor () {
    super('additem', {
      aliases: ['additem'],
      args: [
        {
          id: '_id',
          type: 'number',
          prompt: {
            start: 'Qual é o id do item?',
            retry: 'Informe um id numerico.'
          }
        },
        {
          id: 'price',
          type: 'number',
          prompt: {
            start: 'Qual é o preço do item?',
            retry: 'Informe o preço do item.'
          }
        },
        {
          id: 'name',
          prompt: {
            start: 'Qual é o nome do item?'
          }
        },
        {
          id: 'description',
          prompt: {
            start: 'Qual a descrição do item?'
          }
        }
      ]
    })
  }

  async exec (message: Message, args: AdditemArgs) {
    // TODO: Checar permissões

    const existingItem = await ItemModel.findOne({ _id: args._id.toString() })
    if (existingItem) {
      return await message.channel.send(
        `Esse id já está sendo utilizado por **${existingItem.name}**.`
      )
    }

    const repr =
      `**${args.name}** com a descrição **${args.description}** e id ` +
      `**${args._id}** custando **${formatMoney(args.price)}**`

    const msg = await message.channel.send(`Deseja adicionar o item ${repr}?`)
    const res = await promptUser(msg, message.author)

    if (!res) {
      return await msg.edit('Ok. Cancelando.')
    }

    await new ItemModel(args).save()

    await message.channel.send('Item adicionado.')
  }
}
