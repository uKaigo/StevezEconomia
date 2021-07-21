import { model, Schema } from 'mongoose'

interface Item {
  _id: string,
  name: string,
  description: string,
  price: number
}

const itemSchema = new Schema<Item>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }
})

export const ItemModel = model<Item>('Item', itemSchema)
