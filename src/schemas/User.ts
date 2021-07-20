import { model, Schema } from 'mongoose'

interface User {
  _id: string
  balance: number
  voiceXpAccumulator: number
  lastVoiceXp: number
  gamesPlayed: number
  gamesWon: number
  settings: number
}

const userSchema = new Schema<User>({
  _id: { type: String, required: true },
  balance: { type: Number, default: 1000 },
  voiceXpAccumulator: { type: Number, default: 0 },
  lastVoiceXp: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  settings: { type: Number, default: 0 }
})

export const UserModel = model<User>('User', userSchema)
