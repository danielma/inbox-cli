const { openURL } = require("./utils")
const chalk = require("chalk")
const htmlToText = require("html-to-text")
import settingsEmitter from "./settings"
import { inspect } from "util"

export class GmailThread {
  _thread: any
  messages: [GmailMessage]
  snippet: string
  id: string

  constructor(thread) {
    this._thread = thread

    this.messages = thread.messages.reverse().map(message => new GmailMessage(message))
    this.snippet = this._thread.snippet
    this.id = thread.id
  }
}

interface IGmailMessageHeader {
  name: string
  value: string
}

interface IGmailMessagePart {
  mimeType: string
  body: {
    data?: string
    size: number
  }
  parts?: IGmailMessagePart[]
}

const GmailMessagePart = {
  getPlainText(part: IGmailMessagePart): string {
    if (part.parts) {
      const plainTextPart = part.parts.find(p => p.mimeType === "text/plain")

      if (plainTextPart) {
        return GmailMessagePart.getPlainText(plainTextPart)
      } else {
        return GmailMessagePart.getPlainText(part.parts[0])
      }
    }

    if (!part.body.data) return ""

    const decoded = new Buffer(part.body.data, "base64").toString("utf8")

    if (part.mimeType === "text/plain") {
      return decoded
    } else if (part.mimeType === "text/html") {
      return htmlToText.fromString(decoded)
    }

    return ""
  }
}

interface IGmailMessage {
  payload: {
    headers: IGmailMessageHeader[]
  } & IGmailMessagePart
}

export class GmailMessage {
  _message: IGmailMessage
  _headers: object
  payload: object
  id: string
  threadId: string
  date: Date

  constructor(message) {
    this._message = message
    this._headers = {}
    this._headers = message.payload.headers.reduce((memo, header) => {
      memo[header.name.toLowerCase()] = header.value
      return memo
    }, {})
    this.payload = message.payload
    this.threadId = message.threadId
    this.id = message.id
    this.date = new Date(this._headers["date"])
  }

  get plainSubject(): string {
    return this._headers["subject"]
  }

  get subject() {
    let subject = this.plainSubject.replace(/^re: /i, "")

    if (this.isFromGithub) {
      if (settingsEmitter.load().useNerdFonts) {
        subject = chalk.gray("\uf09b  ") + subject
      } else {
        subject = chalk.white.bgBlackBright("\u2689") + " " + subject
      }
    } else if (this.isFromTrello) {
      if (settingsEmitter.load().useNerdFonts) {
        subject = chalk.blue("\uf181  ") + subject
      } else {
        subject = chalk.white.bgBlue("\u259c") + " " + subject
      }
    }

    return subject
  }

  get plainText() {
    return GmailMessagePart.getPlainText(this._message.payload)
  }

  get externalURL() {
    return this.githubURL || this.trelloURL
  }

  private get isFromTrello() {
    return !!this.trelloURL
  }

  private get isFromGithub() {
    return !!this.githubURL
  }

  private get githubURL() {
    const match = this.plainText.match(/github:\s+(http.+)/im)

    return match && match[1]
  }

  private get trelloURL() {
    const match = this.plainText.match(/\((https:\/\/trello.com.+?)\)/)

    if (!match) return null

    const originalURL = match[1]

    if (settingsEmitter.load().useTrelloDesktop) {
      return originalURL.replace("https://", "trello://")
    } else {
      return originalURL
    }
  }

  open({ background = false } = {}) {
    return new Promise((resolve, reject) => {
      if (this.externalURL) {
        resolve(openURL(this.externalURL, { background }))
      } else {
        reject("no external URL")
      }
    })
  }
}
