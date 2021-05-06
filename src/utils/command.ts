interface MentionToRegex {
  [key: string]: RegExp
  mentionUser: RegExp
  mentionRole: RegExp
  mentionChannel: RegExp
}

const mentionToRegex: MentionToRegex = {
  mentionUser: /<@!?(\d{17,19})>/,
  mentionRole: /<@&(\d{17,19})>/,
  mentionChannel: /<#(\d{17,19})>/
}

interface ArgsBase {
  name: string
}

interface Flag extends ArgsBase {
  match: 'flag'
  flag: string
  defaultValue?: boolean
}

interface Mention extends ArgsBase {
  match: 'mentionUser' | 'mentionRole' | 'mentionChannel'
  defaultValue?: string
}
interface Content extends ArgsBase {
  match: 'content'
  defaultValue?: string | number
  contentFilter?: (value: string, index: number, array: string[]) => boolean
}

interface Rest extends ArgsBase {
  match: 'rest'
  defaultValue?: any
}

export type Args = Flag | Mention | Content | Rest

export function parseArgs(
  commandArgs: Args[] | undefined,
  messageArgs: string[]
): Record<string, unknown> | null {
  if (commandArgs === undefined) return null

  const messageArgsNullableCopy: Array<string | null> = [...messageArgs]
  const args: Record<string, unknown> = {}

  for (const entry of commandArgs) {
    switch (entry.match) {
      case 'flag':
        parseFlags(args, entry, messageArgsNullableCopy)
        break
      case 'mentionUser':
      case 'mentionRole':
      case 'mentionChannel':
        parseMention(args, entry, messageArgsNullableCopy)
        break
      case 'content':
        parseContent(args, entry, messageArgs)
        break
      case 'rest':
        parseRest(args, entry, messageArgsNullableCopy)
        break
    }
  }
  return args
}

function parseFlags(
  args: Record<string, unknown>,
  entry: Flag,
  argsNullable: Array<string | null>
): void {
  for (let i = 0; i < argsNullable.length; i++) {
    if (entry.flag === argsNullable[i]) {
      argsNullable[i] = null
      args[entry.name] = true
      break
    } else args[entry.name] = entry.defaultValue ?? false
  }
}

function parseMention(
  args: Record<string, unknown>,
  entry: Mention,
  argsNullable: Array<string | null>
): void {
  const regex = mentionToRegex[entry.match]
  const index = argsNullable.findIndex(
    (x) => typeof x === 'string' && regex.test(x)
  )
  const regexMatches = regex.exec(argsNullable[index]!)
  args[entry.name] =
    regexMatches !== null
      ? regexMatches[0].replace(regex, '$1')
      : entry.defaultValue
  argsNullable[index] = null
}

function parseContent(
  args: Record<string, unknown>,
  entry: Content,
  argsNonNullable: string[]
): void {
  args[entry.name] =
    argsNonNullable.length > 0
      ? entry.contentFilter !== undefined
        ? argsNonNullable.filter(entry.contentFilter)
        : argsNonNullable
      : entry.defaultValue
}

function parseRest(
  args: Record<string, unknown>,
  entry: Rest,
  argsNullable: Array<string | null>
): void {
  const restValues = argsNullable.filter((x) => typeof x === 'string')
  args[entry.name] =
    restValues.length > 0 ? restValues?.join(' ') : entry.defaultValue
}
