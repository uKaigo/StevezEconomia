import { blue } from 'chalk'

export class Logger {
  info (message: string) {
    console.info(`${blue('[INFO]')} ${message}`)
  }
}
