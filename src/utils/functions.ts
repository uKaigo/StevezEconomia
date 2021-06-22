export function getUtcTimestamp () {
  return Math.floor(new Date().getTime() / 1000)
}
