import { model, Schema } from 'mongoose'

interface User {
  _id: string
  balance: number
  items: string[]
}

const userSchema = new Schema<User>({
  _id: { type: String, required: true },
  balance: { type: String },
  items: { type: String }
})

export const UserModel = model<User>('User', userSchema)
