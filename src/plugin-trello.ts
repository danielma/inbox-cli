import { GmailMessage } from "./gmail-classes"
import settings from "./settings"
const chalk = require("chalk")

export function getSettings(): ISetting[] {
  return [
    {
      type: "boolean",
      name: "trello.useDesktop",
      label: "Open trello links in trello desktop app",
      default: false
    }
  ]
}

export function recognize(message: GmailMessage): MessageRecognition {
  const url = trelloURL(message)

  if (!url) return

  return {
    nerdFontIcon: chalk.blue("\uf181"),
    asciiIcon: chalk.white.bgBlue("\u259c"),
    externalURL: url,
    getFrom
  }
}

function getFrom(message: GmailMessage): string {
  return "Trello"
}

function trelloURL(message: GmailMessage): string | null {
  const match = message.plainText.match(/\((https:\/\/trello.com.+?)\)/)

  if (!match) return null

  const originalURL = match[1]

  if (settings.load().useTrelloDesktop) {
    return originalURL.replace("https://", "trello://")
  } else {
    return originalURL
  }
}

export default exports
