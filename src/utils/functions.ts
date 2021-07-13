export function getUtcTimestamp () {
  return Math.floor(new Date().getTime() / 1000)
}

export function randint (min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}
