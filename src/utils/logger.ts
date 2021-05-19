import { blueBright, gray, dim } from 'chalk'

export class Logger {
  lastDate: string | null
  constructor () {
    this.lastDate = null
  }

  private getDate (): string {
    const date = new Date()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const dateString = `${hours}:${minutes}:${seconds}`

    if (this.lastDate === dateString) {
      return ' '.repeat(this.lastDate.length + 2)
    }
    this.lastDate = dateString

    return dim(gray(`[${dateString}]`))
  }

  debug (message: string) {
    console.debug(`${this.getDate()} ${dim('[DEBUG]')} ${gray(message)}`)
  }
  info (message: string) {
    console.info(`${this.getDate()} ${blueBright('[INFO]')}  ${message}`)
  }
}
