import { model, Schema } from 'mongoose'

interface SenaInfo {
  _id: string
  rewardedNumbers: number[]
  startDate: number[]
  accumulatedPrize: number[]
}

const senaSchema = new Schema<SenaInfo>({
  _id: { type: String, default: 'megasena' },
  rewardedNumbers: { type: [Number], required: true },
  startDate: { type: [Number], required: true },
  accumulatedPrize: { type: [Number], required: true }
})

export const SenaModel = model<SenaInfo>('SenaInfo', senaSchema, 'megasena')

interface BetInfo {
  _id: string
  numbers: number[]
}

const betSchema = new Schema<BetInfo>({
  _id: { type: String, required: true },
  numbers: { type: [Number], required: true },
  bet: { type: Number, required: true }
})

export const BetModel = model<BetInfo>('BetInfo', betSchema, 'megasena')
