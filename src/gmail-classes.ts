const { openURL } = require("./utils")

const USE_TRELLO_DESKTOP = true

export class GmailThread {
  _thread: any
  messages: [GmailMessage]
  snippet: string
  id: string

  isOpen = false

  constructor(thread) {
    this._thread = thread

    this.messages = thread.messages.reverse().map(message => new GmailMessage(message))
    this.snippet = this._thread.snippet
    this.id = thread.id
  }
}

export class GmailMessage {
  _message: any
  _headers: object
  payload: object

  constructor(message) {
    this._message = message
    this._headers = {}
    this._headers = message.payload.headers.reduce((memo, header) => {
      memo[header.name.toLowerCase()] = header.value
      return memo
    }, {})
    this.payload = message.payload
  }

  get id() {
    return this._message.id
  }

  get threadId() {
    return this._message.threadId
  }

  get subject() {
    return this._headers["subject"]
  }

  get plainText() {
    const { parts } = this._message.payload

    if (!parts) return ""

    const plainText = parts.find(p => p.mimeType === "text/plain") || parts[0]

    if (!plainText.body.data) return ""

    return new Buffer(plainText.body.data, "base64").toString("utf8")
  }

  get externalURL() {
    return this.githubURL || this.trelloURL
  }

  get githubURL() {
    const match = this.plainText.match(/github:\s+(http.+)/im)

    return match && match[1]
  }

  get trelloURL() {
    const match = this.plainText.match(/\((https:\/\/trello.com.+?)\)/)

    if (!match) return null

    const originalURL = match[1]

    if (USE_TRELLO_DESKTOP) {
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
