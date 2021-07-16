import {
  User,
  GuildMember,
  MessageReaction,
  Message,
  ClientUser
} from 'discord.js'

export function getUtcTimestamp () {
  return Math.floor(new Date().getTime() / 1000)
}

export function randint (min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

export async function promptUser (
  message: Message,
  member: User | GuildMember
) {
  await message.react('✅')
  await message.react('❌')

  let collected
  try {
    collected = await message.awaitReactions(
      (reaction: MessageReaction, user: User | ClientUser) => {
        return (
          reaction.message.id === message.id &&
          ['✅', '❌'].includes(reaction.emoji.name) &&
          user.id == member.id
        )
      },
      {
        max: 1,
        time: 30000,
        errors: ['time']
      }
    )
  } catch {
    return false
  }

  const reaction = collected.first()
  if (reaction?.emoji.name === '❌') {
    return false
  }

  return true
}
