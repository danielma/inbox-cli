import * as React from "react"
const blessed = require("blessed")
const { render } = require("react-blessed/dist/fiber/fiber")
const authorize = require("./authorize")
import { GmailMessage, GmailThread } from "./gmail-classes"
import { inspect } from "util"

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
  openThreads: { [threadId: string]: boolean }
  status: string | null
}

class App extends React.Component<IAppProps, IAppState> {
  private messageList: BlessedListInstance

  constructor(props: IAppProps) {
    super(props)
    this.state = {
      threads: [],
      openThreads: {},
      selectedIndex: null,
      error: null,
      lastArchivedThreadId: null,
      status: null
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
    this.logStatus("loading")
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
            return gmail.threads.get({ userId, id: thread.id }).then(thread => {
              this.logStatus(`loaded ${thread.id}`)
              return thread
            })
          })
        )
      })
      .then(threads => threads.map(t => new GmailThread(t)))
      .then(threads => this.setState({ threads }))
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
      selectedMessage
        .open({ background: true })
        .then(() => this.logStatus(`open ${selectedMessage.externalURL}`))
        .catch(this.logError)
    } else if (full === "C-d") {
      this.archiveThread(selectedMessage.threadId)
    } else if (full === "C-z" && this.state.lastArchivedThreadId) {
      this.unarchiveLastArchivedThread()
    } else if (full === "r") {
      this.reloadInbox()
    } else if (full === "l" || full === "right") {
      this.setState(({ openThreads }) => {
        openThreads[selectedMessage.threadId] = true

        return { openThreads }
      })
    } else if (full === "h" || full === "left") {
      this.setState(
        ({ openThreads }) => {
          delete openThreads[selectedMessage.threadId]

          return { openThreads }
        },
        () => {
          const thread = this.state.threads.find(t => t.id == selectedMessage.threadId)
          if (!thread) throw "no thread!"

          const message = thread.messages[0]
          messageList.select(this.messages.findIndex(m => m.id == message.id))
          messageList.screen.render()
        }
      )
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

  private statusTimeout: NodeJS.Timer | null = null

  logStatus = status => {
    this.setState({ status })
    this.statusTimeout && clearTimeout(this.statusTimeout)
    this.statusTimeout = setTimeout(() => this.setState({ status: null }), 2000)
  }

  get messages(): GmailMessage[] {
    let messages: GmailMessage[] = []

    return this.state.threads.reduce((memo, thread) => {
      if (this.state.openThreads[thread.id]) {
        return memo.concat(thread.messages)
      } else {
        return memo.concat([thread.messages[0]])
      }
    }, messages)
  }

  get messageSubjects() {
    let subjects: string[] = []
    const nullChar = "\0"
    // ▶ ▼ █

    return this.state.threads.reduce((memo, thread) => {
      if (this.state.openThreads[thread.id]) {
        const marker = thread.messages.length > 1 ? "▼" : " "
        const firstSubject = `${marker} ${thread.messages[0].subject}`
        const restSubjects = thread.messages
          .slice(1)
          .map((m, index) => `    ${m.subject}${nullChar.repeat(index)}`)

        return memo.concat([firstSubject, ...restSubjects])
      } else {
        const marker = thread.messages.length > 1 ? "▶" : " "
        return memo.concat([`${marker} ${thread.messages[0].subject}`])
      }
    }, subjects)
  }

  render() {
    const { error, status } = this.state
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
            messages[index]
              .open()
              .then(() => this.logStatus(`open ${selectedMessage.externalURL}`))
              .catch(this.logError)
          }}
          onKeypress={this.handleMessageListKeypress}
          ref={ref => (this.messageList = ref)}
        />
        <box
          border={{ type: "line" }}
          style={{ border: { fg: "blue" }, selected: { bg: "gray" } }}
          top="20%"
          height={(error ? "60%" : "80%") + "-2"}
          width="100%"
          mouse
          scrollable
        >
          {selectedMessage && selectedMessage.plainText}
        </box>
        {error && (
          <box
            border={{ type: "line" }}
            style={{ border: { fg: "red" } }}
            top="70%"
            height="20%"
            width="100%"
            mouse
            scrollable
          >
            {inspect(error)}
          </box>
        )}
        <box
          border={{ type: "line" }}
          style={{ border: { fg: "gray" } }}
          bottom="0"
          height="0%+3"
          width="100%"
          scrollable
          tags
          content={status || ""}
        />
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
