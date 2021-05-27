declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string
      MONGO_URI: string
    }
  }
}

export {}
