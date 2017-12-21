const { openURL } = require("./utils")
const chalk = require("chalk")
const htmlToText = require("html-to-text")
import settingsEmitter from "./settings"
import { inspect } from "util"

const plugins: IPlugin[] = [require("./plugin-github"), require("./plugin-trello")]

export class GmailThread {
  private _thread: {
    id: string
    snippet: string
    messages: object[]
  }

  messages: GmailMessage[]
  snippet: string
  id: string

  constructor(thread) {
    this._thread = thread

    this.snippet = this._thread.snippet
    this.id = thread.id
    this.messages = this.getMessages()

    settingsEmitter.on("update", () => {
      this.messages = this.getMessages()
    })
  }

  private getMessages(): GmailMessage[] {
    let messages = this._thread.messages

    if (!settingsEmitter.load().threadSortOldestFirst) {
      messages = [...messages].reverse()
    }

    return messages.map(message => new GmailMessage(message))
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
  private _message: IGmailMessage
  private _headers: object
  private payload: object
  private pluginRecognition: MessageRecognition

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

    const plugin = plugins.find(p => !!p.recognize(this))
    this.pluginRecognition = plugin && plugin.recognize(this)
  }

  get plainSubject(): string {
    return this._headers["subject"]
  }

  get subject() {
    let subject = this.plainSubject.replace(/^re: /i, "")

    if (this.pluginRecognition) {
      if (settingsEmitter.load().useNerdFonts) {
        subject = this.pluginRecognition.nerdFontIcon + "  " + subject
      } else {
        subject = this.pluginRecognition.asciiIcon + " " + subject
      }
    }

    return subject
  }

  get from() {
    if (this.pluginRecognition && this.pluginRecognition.getFrom) {
      return this.pluginRecognition.getFrom(this)
    }

    return this.getHeader("from")
  }

  get plainText() {
    return GmailMessagePart.getPlainText(this._message.payload)
  }

  get externalURL() {
    return this.pluginRecognition && this.pluginRecognition.externalURL
  }

  getHeader(header: string): string | null {
    return this._headers[header]
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
