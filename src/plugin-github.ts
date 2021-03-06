import { GmailMessage } from "./gmail-classes"
import settings from "./settings"
const chalk = require("chalk")

export function getQuery(): string {
  return "from:github.com"
}

export function getSettings(): ISetting[] {
  return []
}

export function recognize(message: GmailMessage): MessageRecognition {
  const url = githubURL(message)

  if (!url) return

  return {
    nerdFontIcon: chalk.gray("\uf09b"),
    asciiIcon: chalk.white.bgBlackBright("\u2689"),
    externalURL: url,
    getFrom
  }
}

function getFrom(message: GmailMessage): string {
  return message.getHeader("x-github-sender")!
}

function githubURL(message: GmailMessage): string | null {
  const match = message.plainText.match(/github:\s+(http.+)/im)

  return match && match[1]
}

export default exports
