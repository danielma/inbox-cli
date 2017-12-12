/// <reference path="./global.d.ts" />

import React = require("react")
import blessed = require("blessed")
import { render } from "react-blessed/dist/fiber/fiber"
import authorize = require("./authorize")
import google = require("googleapis")
import googleAuth = require("google-auth-library")
import { exec } from "child_process"
import { inspect } from "util"

const gmail = google.gmail("v1")

const USE_TRELLO_DESKTOP = true

class GmailThread {
  _thread: any
  messages: [GmailMessage]
  snippet: String

  constructor(thread) {
    this._thread = thread

    this.messages = thread.messages.map(message => new GmailMessage(message))
    this.snippet = this._thread.snippet
  }
}

class GmailMessage {
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

function promisify(fn) {
  return function promisedFn(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, response) => {
        if (err) {
          reject(err)
        }
        resolve(response)
      })
    })
  }
}

const listThreads = promisify(gmail.users.threads.list)
const getThread = promisify(gmail.users.threads.get)
const modifyThread = promisify(gmail.users.threads.modify)

function openURL(url, { background = false } = {}) {
  const backgroundOption = background ? "-g" : ""
  return exec(`open ${backgroundOption} ${url}`)
}

interface IAppProps {
  auth: object
}

interface IAppState {
  threads: GmailThread[]
  selectedIndex: number | null
  error: any
  lastArchivedThreadId: number | null
}

class App extends React.Component<IAppProps, IAppState> {
  private messageList: BlessedListInstance

  constructor(props: IAppProps) {
    super(props)
    this.state = {
      threads: [],
      selectedIndex: null,
      error: null,
      lastArchivedThreadId: null
    }
  }

  componentDidMount() {
    this.reloadInbox()
    this.messageList.focus()
    this.setupReloadInterval()
  }

  setupReloadInterval = () => {
    setInterval(this.reloadInbox, 30000)
  }

  reloadInbox = () => {
    this.setState({ error: "loading" })
    const { auth } = this.props
    const userId = "me"
    return listThreads({
      auth,
      userId,
      labelIds: ["INBOX"]
    })
      .then(({ threads }) => {
        return Promise.all(
          (threads || []).map(thread => {
            return getThread({ auth, userId, id: thread.id })
          })
        )
      })
      .then(threads => threads.map(t => new GmailThread(t)))
      .then(threads => this.setState({ threads, error: null }))
  }

  handleMessageListKeypress = (_ch, key) => {
    const { full } = key
    const { messageList } = this
    const { messages } = this
    const selectedMessage = messages[messageList.selected]
    if (full === "C-o") {
      selectedMessage.open({ background: true }).catch(this.logError)
    } else if (full === "C-d") {
      this.archiveThread(selectedMessage.threadId)
    } else if (full === "C-p") {
      messageList.up()
      messageList.screen.render()
    } else if (full === "C-n") {
      messageList.down()
      messageList.screen.render()
    } else if (full === "C-z" && this.state.lastArchivedThreadId) {
      this.unarchiveLastArchivedThread()
    } else if (full === "r") {
      this.reloadInbox()
    }
  }

  archiveThread = threadId => {
    modifyThread({
      auth: this.props.auth,
      userId: "me",
      id: threadId,
      resource: { removeLabelIds: ["INBOX"] }
    }).then((thread: any) => {
      this.setState({ lastArchivedThreadId: thread.id })
      this.reloadInbox()
    }, this.logError)
  }

  unarchiveLastArchivedThread = () => {
    modifyThread({
      auth: this.props.auth,
      userId: "me",
      id: this.state.lastArchivedThreadId,
      resource: { addLabelIds: ["INBOX"] }
    }).then(_thread => {
      this.setState({ lastArchivedThreadId: null })
      this.reloadInbox()
    }, this.logError)
  }

  logError = error => {
    this.setState({ error })
  }

  get messages(): GmailMessage[] {
    let messages: GmailMessage[] = []

    return this.state.threads.reduce((memo, thread) => {
      return memo.concat(thread.messages)
    }, messages)
  }

  get messageSubjects() {
    let subjects: string[] = []
    const nullChar = "\0"

    return this.state.threads.reduce((memo, thread) => {
      const firstSubject = thread.messages[0].subject
      const restSubjects = thread.messages
        .slice(1)
        .map((m, index) => `  ${m.subject}${nullChar.repeat(index)}`)

      return memo.concat([firstSubject, ...restSubjects])
    }, subjects)
  }

  render() {
    const { error } = this.state
    const { messages, messageSubjects } = this
    const selectedMessage = messages[this.state.selectedIndex || 0]

    return (
      <element>
        <list
          width="100%"
          height="20%"
          border={{ type: "line" }}
          style={{ border: { fg: "blue" }, selected: { bg: "gray" } }}
          items={messageSubjects}
          vi
          keys
          onSelectItem={(_item, index) => {
            this.setState({ selectedIndex: index })
          }}
          onSelect={(_item, index) => {
            messages[index].open().catch(this.logError)
          }}
          onKeypress={this.handleMessageListKeypress}
          ref={ref => (this.messageList = ref)}
        />
        <box
          border={{ type: "line" }}
          style={{ border: { fg: "blue" }, selected: { bg: "gray" } }}
          top="20%"
          height={error ? "60%" : "80%"}
          width="100%"
        >
          {selectedMessage && selectedMessage.plainText}
        </box>
        {error && (
          <box
            border={{ type: "line" }}
            style={{ border: { fg: "red" } }}
            top="80%"
            height="20%"
            width="100%"
            mouse
            scrollable
          >
            {inspect(error)}
          </box>
        )}
      </element>
    )
  }
}

authorize().then(auth => {
  // Creating our screen
  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: "inbox"
  })

  // Adding a way to quit the program
  screen.key(["q", "C-c"], function(ch, key) {
    return process.exit(0)
  })

  const component = render(<App auth={auth} />, screen)
})
