import * as React from "react"
const blessed = require("blessed")
const { render } = require("react-blessed/dist/fiber/fiber")
const authorize = require("./authorize")
import { inspect } from "util"
const { openURL } = require("./utils")

const USE_TRELLO_DESKTOP = true

class GmailThread {
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

  get marker() {
    if (this.messages.length === 1) return " "

    return this.isOpen ? "▼" : "▶"
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

interface IAppProps {
  gmail: {
    threads: {
      list(options: object): Promise<{ threads: any[] }>
      get(options: object): Promise<any>
      modify(options: object): Promise<any>
    }
  }
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
    const { gmail } = this.props
    const userId = "me"
    return gmail.threads
      .list({
        userId,
        labelIds: ["INBOX"]
      })
      .then(({ threads }) => {
        return Promise.all(
          (threads || []).map(thread => {
            return gmail.threads.get({ userId, id: thread.id })
          })
        )
      })
      .then(threads => threads.map(t => new GmailThread(t)))
      .then(threads => this.setState({ threads, error: null }))
  }

  handleMessageListMovement = key => {
    const { full } = key
    const { messageList } = this

    let handled = false

    if (full === "C-p" || full === "k") {
      messageList.up()
      handled = true
    } else if (full === "C-n" || full === "j") {
      messageList.down()
      handled = true
    } else if (full === "g") {
      messageList.select(0)
      handled = true
    } else if (full === "S-g") {
      messageList.select(messageList.items.length - 1)
      handled = true
    }

    if (handled) {
      messageList.screen.render()
    }

    return handled
  }

  handleMessageListKeypress = (_ch, key) => {
    const { full } = key

    if (this.handleMessageListMovement(key)) return

    const { messageList } = this
    const { messages } = this
    const selectedMessage = messages[messageList.selected]
    if (full === "C-o") {
      selectedMessage.open({ background: true }).catch(this.logError)
    } else if (full === "C-d") {
      this.archiveThread(selectedMessage.threadId)
    } else if (full === "C-z" && this.state.lastArchivedThreadId) {
      this.unarchiveLastArchivedThread()
    } else if (full === "r") {
      this.reloadInbox()
    } else if (full === "l" || full === "right") {
      this.setState((state, _props) => {
        const threadIndex = state.threads.findIndex(t => t.id == selectedMessage.threadId)

        if (threadIndex !== -1) {
          const { threads } = state
          threads[threadIndex].isOpen = true

          return { threads }
        }
      })
    } else if (full === "h" || full === "left") {
      this.setState((state, _props) => {
        const threadIndex = state.threads.findIndex(t => t.id == selectedMessage.threadId)

        if (threadIndex !== -1) {
          const { threads } = state
          threads[threadIndex].isOpen = false

          return { threads }
        }
      })
    }
  }

  archiveThread = threadId => {
    this.props.gmail.threads
      .modify({
        userId: "me",
        id: threadId,
        resource: { removeLabelIds: ["INBOX"] }
      })
      .then((thread: any) => {
        this.setState({ lastArchivedThreadId: thread.id })
        this.reloadInbox()
      }, this.logError)
  }

  unarchiveLastArchivedThread = () => {
    this.props.gmail.threads
      .modify({
        userId: "me",
        id: this.state.lastArchivedThreadId,
        resource: { addLabelIds: ["INBOX"] }
      })
      .then(_thread => {
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
      if (thread.isOpen) {
        return memo.concat(thread.messages)
      } else {
        return memo.concat([thread.messages[0]])
      }
    }, messages)
  }

  get messageSubjects() {
    let subjects: string[] = []
    const nullChar = "\0"

    return this.state.threads.reduce((memo, thread) => {
      if (thread.isOpen) {
        const firstSubject = `${thread.marker} ${thread.messages[0].subject}`
        const restSubjects = thread.messages
          .slice(1)
          .map((m, index) => `    ${m.subject}${nullChar.repeat(index)}`)

        return memo.concat([firstSubject, ...restSubjects])
      } else {
        return memo.concat([`${thread.marker} ${thread.messages[0].subject}`])
      }
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

function promisify(
  fn: (options: object, cb: (err, response) => void) => void
): (options: object) => Promise<any> {
  return function promisedFn(options) {
    return new Promise((resolve, reject) => {
      fn(options, (err, response) => {
        if (err) {
          reject(err)
        }
        resolve(response)
      })
    })
  }
}

authorize().then((gmail: GmailAPIInstance) => {
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

  const gmailApi = {
    threads: {
      list: promisify(gmail.users.threads.list),
      get: promisify(gmail.users.threads.get),
      modify: promisify(gmail.users.threads.modify)
    }
  }

  const component = render(<App gmail={gmailApi} />, screen)
})
