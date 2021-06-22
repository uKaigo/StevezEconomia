import { model, Schema } from 'mongoose'

interface User {
  _id: string
  balance: number
  items: number
  voiceXpAccumulator: number
  lastVoiceXp: number
}

const userSchema = new Schema<User>({
  _id: { type: String, required: true },
  balance: { type: Number, default: 1000 },
  items: { type: Number, default: 0 },
  voiceXpAccumulator: { type: Number, default: 0 },
  lastVoiceXp: { type: Number, default: 0 }
})

export const UserModel = model<User>('User', userSchema)
