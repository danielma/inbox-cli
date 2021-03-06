import * as React from "react"
const blessed = require("neo-blessed")
const { render } = require("react-blessed/dist/fiber/fiber")
const authorize = require("./authorize")
import { GmailMessage, GmailThread } from "./gmail-classes"
import { threads as fakeThreads } from "./fake-threads"
import { inspect } from "util"
import { withRightAlignedText, formatDate, promisify } from "./utils"
import ErrorBoundary from "./ErrorBoundary"
import Help from "./Help"
import settingsEmitter, { Settings } from "./settings"
import keybindings from "./keybindings"
import notifier from "./notifier"
import { exec } from "child_process"

const FAKE_IT = process.argv.indexOf("--fake") > -1

const plugins: IPlugin[] = [require("./plugin-github"), require("./plugin-trello")]

interface IAppProps {
  gmail: {
    threads: {
      list(options: object): Promise<{ threads: any[] }>
      get(options: object): Promise<any>
      modify(options: object): Promise<any>
    }
  }
  screen: BlessedReactScreenInstance
}

interface IAppState {
  threads: GmailThread[]
  selectedIndex: number | null
  error: any
  lastArchivedThreadId: number | null
  openThreads: { [threadId: string]: boolean }
  status: string | null
  searching: boolean
  fuzzySearch: string | null
  showHelp: boolean
  hasEverLoadedInbox: boolean
}

export interface IAppContext {
  screen: BlessedReactScreenInstance
  logStatus(status: string): void
}

class App extends React.Component<IAppProps, IAppState> {
  refs: {
    messageList: BlessedListInstance
    searchBox: BlessedTextBoxInstance
  }

  constructor(props: IAppProps) {
    super(props)
    this.state = {
      threads: [],
      openThreads: {},
      selectedIndex: null,
      error: null,
      lastArchivedThreadId: null,
      status: null,
      searching: false,
      fuzzySearch: null,
      showHelp: false,
      hasEverLoadedInbox: false
    }
  }

  componentDidMount() {
    this.reloadInbox()
    this.refs.messageList.focus()
    this.setupReloadInterval()

    settingsEmitter.on("update", (settings, prevSettings) => {
      this.logStatus("Settings updated")
      if (this.getThreadQuery(settings) !== this.getThreadQuery(prevSettings)) {
        this.reloadInbox()
      }

      setTimeout(() => this.forceUpdate(), 0)
    })

    this.props.screen.key(["?"], () => this.setState({ showHelp: true }))
    this.setTmuxTitle({ initial: true })
  }

  componentDidUpdate(_prevProps: IAppProps, prevState: IAppState) {
    if (prevState.showHelp && !this.state.showHelp) {
      this.refs.messageList.focus()
    }

    this.setTmuxTitle()

    if (prevState.selectedIndex !== this.state.selectedIndex && this.selectedThread) {
      notifier.hideNotification(this.selectedThread)
    }
  }

  setupReloadInterval = () => {
    setInterval(this.reloadInbox, 30 * 60000) // 30 minutes
  }

  reloadFakeInbox = () => {
    this.setState({ threads: fakeThreads })
  }

  reloadInbox = () => {
    this.logStatus("loading")
    const { gmail } = this.props
    const userId = "me"

    if (FAKE_IT) return this.reloadFakeInbox()

    return gmail.threads
      .list({
        userId,
        labelIds: ["INBOX"],
        q: this.getThreadQuery()
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
      .then(threads => {
        if (this.state.hasEverLoadedInbox) {
          notifier.processNewThreads(this.state.threads, threads)
        }
        this.setState({ threads, hasEverLoadedInbox: true })
      })
  }

  setTmuxTitle = ({ initial } = { initial: false }) => {
    const ifTmux = '[ -n "$TMUX" ] && '
    // const getWindow = `tmux display-message -p '#I'`
    if (initial) {
      // exec(`${ifTmux} tmux rename-window -t $(${getWindow}) inbox-cli`)
      exec(`${ifTmux} tmux rename-window inbox-cli`)
    } else {
      exec(`${ifTmux} tmux rename-window -t inbox-cli "inbox-cli (${this.state.threads.length})"`)
      // exec(
      //   `${ifTmux} tmux rename-window -t $(${getWindow}) "inbox-cli (${this.state.threads.length})"`
      // )
    }
  }

  getThreadQuery = (settings = settingsEmitter.load()) => {
    if (settings.knownOnly) {
      return plugins.reduce((memo, plugin, index) => {
        if (index === 0) {
          return `(${plugin.getQuery()})`
        } else {
          return `${memo} OR (${plugin.getQuery()})`
        }
      }, "")
    } else {
      return ""
    }
  }

  handleMessageListMovement = (messageList, key) => {
    const { full } = key

    let handled = false
    const matchedBinding = keybindings[full]

    if (matchedBinding === "messageList.up") {
      messageList.up()
      handled = true
    } else if (matchedBinding === "messageList.down") {
      messageList.down()
      handled = true
    } else if (matchedBinding === "messageList.top") {
      messageList.select(0)
      handled = true
    } else if (matchedBinding === "messageList.bottom") {
      messageList.select(messageList.items.length - 1)
      handled = true
    }

    if (handled) {
      this.props.screen.render()
    }

    return handled
  }

  handleMessageListKeypress = (messageList: BlessedListInstance, _ch, key) => {
    const { full } = key

    if (this.handleMessageListMovement(messageList, key)) return

    const { messages } = this
    const selectedMessage = messages[messageList.selected]
    const matchedBinding = keybindings[full]

    if (matchedBinding === "selectedMessage.openInBackground") {
      selectedMessage
        .open({ background: true })
        .then(() => this.logStatus(`open ${selectedMessage.externalURL}`))
        .catch(this.logError)
    } else if (matchedBinding === "selectedMessage.archive") {
      this.archiveThread(selectedMessage.threadId)
    } else if (matchedBinding === "archive.undo" && this.state.lastArchivedThreadId) {
      this.unarchiveLastArchivedThread()
    } else if (matchedBinding === "inbox.reload") {
      this.reloadInbox()
    } else if (matchedBinding === "selectedThread.expand") {
      this.setState(({ openThreads }) => {
        openThreads[selectedMessage.threadId] = true

        return { openThreads }
      })
    } else if (matchedBinding === "selectedThread.close") {
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
          this.props.screen.render()
        }
      )
    } else if (matchedBinding === "search.open") {
      this.setState({ searching: true }, () => {
        this.refs.searchBox.focus()
      })
    } else if (matchedBinding === "app.quit") {
      this.props.screen.destroy()
    }
  }

  handleSearchBoxKeypress = (searchBox, _ch, key) => {
    const { full } = key

    if (full === "C-k") {
      searchBox.setValue("")
      this.setState({ fuzzySearch: "" })
    } else {
      setTimeout(
        () =>
          this.setState({
            fuzzySearch: this.refs.searchBox ? this.refs.searchBox.value : null
          }),
        0
      )
    }
  }

  archiveThread = threadId => {
    this.logStatus(`archived ${threadId}`)
    const lastThreads = this.state.threads
    const nextThreads = lastThreads.filter(t => t.id != threadId)

    this.setState({ threads: nextThreads })

    this.props.gmail.threads
      .modify({
        userId: "me",
        id: threadId,
        resource: { removeLabelIds: ["INBOX"] }
      })
      .then(
        (thread: any) => {
          this.setState({ lastArchivedThreadId: thread.id })
        },
        error => {
          this.logError(error)
          this.setState({ threads: lastThreads })
        }
      )
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

  private errorTimeout: NodeJS.Timer | null = null

  logError = error => {
    this.setState({ error })
    this.errorTimeout && clearTimeout(this.errorTimeout)
    this.errorTimeout = setTimeout(() => this.setState({ error: null }), 5000)
  }

  private statusTimeout: NodeJS.Timer | null = null

  logStatus = status => {
    this.setState({ status })
    this.statusTimeout && clearTimeout(this.statusTimeout)
    this.statusTimeout = setTimeout(() => this.setState({ status: null }), 2000)
  }

  get filteredThreads(): GmailThread[] {
    const { fuzzySearch, searching } = this.state

    if (fuzzySearch && searching) {
      const fuzzyRegex = new RegExp(fuzzySearch.replace(/\W+/g, ".*"), "gi")

      return this.state.threads.filter(thread => {
        const subject: string = thread.messages[0].plainSubject

        return subject.match(fuzzyRegex)
      })
    } else {
      return this.state.threads
    }
  }

  get messages(): GmailMessage[] {
    let messages: GmailMessage[] = []

    return this.filteredThreads.reduce((memo, thread) => {
      if (this.state.openThreads[thread.id]) {
        return memo.concat(thread.messages)
      } else {
        return memo.concat([thread.messages[0]])
      }
    }, messages)
  }

  getArrow = (thread: GmailThread) => {
    if (this.state.openThreads[thread.id]) {
      return "▼"
    } else {
      return "▶"
    }
  }

  getMessageSubject = (message: GmailMessage, thread: GmailThread, index: number = 0) => {
    const isFirst = message === thread.messages[0]
    const showArrow = thread.messages.length > 1

    let subject = message.subject

    if (isFirst) {
      subject = showArrow ? `${this.getArrow(thread)} ${subject}` : `  ${subject}`
    } else {
      subject = `    ${subject}`
    }

    return (
      withRightAlignedText(subject, {
        right: `${message.from} {gray-fg}${formatDate(message.date)}{/}`,
        list: this.refs.messageList
      }) + "\0".repeat(index)
    )
  }

  get messageSubjects() {
    let subjects: string[] = []

    return this.filteredThreads.reduce((memo, thread, threadIndex) => {
      let s: string[]

      if (this.state.openThreads[thread.id]) {
        s = thread.messages.map((m, index) => this.getMessageSubject(m, thread, index))
      } else {
        s = [this.getMessageSubject(thread.messages[0], thread, threadIndex)]
      }

      return memo.concat(s)
    }, subjects)
  }

  get selectedMessage() {
    return this.messages[this.state.selectedIndex || 0]
  }

  get selectedThread(): GmailThread | null {
    if (this.selectedMessage) {
      return this.selectedMessage.thread
    }

    return null
  }

  render() {
    const { error, status, searching, showHelp } = this.state
    const { messages, messageSubjects, selectedMessage } = this

    return (
      <element>
        <list
          width="100%"
          height="25%"
          border={{ type: "line" }}
          style={{
            border: { fg: "blue" },
            selected: { bg: "blue", fg: "black" }
          }}
          items={messageSubjects.concat([""])}
          tags
          keys
          mouse
          onSelectItem={(_node, _i, selectedIndex) => this.setState({ selectedIndex })}
          onSelect={(_node, _item, index) => {
            messages[index] &&
              messages[index]
                .open()
                .then(() => this.logStatus(`open ${selectedMessage.externalURL}`))
                .catch(this.logError)
          }}
          onKeypress={this.handleMessageListKeypress}
          ref="messageList"
          scrollbar={{ style: { bg: "white" }, track: { bg: "gray" } }}
        />
        {searching && (
          <box
            width={30}
            height="0%+3"
            left="100%-30"
            top="0%"
            index={2}
            border={{ type: "line" }}
            style={{ border: { fg: "yellow" } }}
          >
            <box width={7} height={1} content={"{bold}filter{/} "} tags />
            <textbox
              left={7}
              keys
              mouse
              inputOnFocus
              ref="searchBox"
              onBlur={() => {
                if (!this.state.fuzzySearch) this.setState({ searching: false })
              }}
              onKeypress={this.handleSearchBoxKeypress}
            />
          </box>
        )}
        <box
          border={{ type: "line" }}
          style={{ border: { fg: "gray" }, selected: { bg: "gray" } }}
          top="25%"
          height={4}
          width="100%"
          mouse
          scrollable
        >
          {selectedMessage && `${selectedMessage.subject}\nFrom: ${selectedMessage.from}`}
        </box>
        <box
          border={{ type: "line" }}
          style={{ border: { fg: "gray" }, selected: { bg: "gray" } }}
          top="25%+4"
          height="75%-4"
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
            top="80%"
            height="20%"
            width="100%"
            mouse
            scrollable
            index={2}
          >
            {inspect(error)}
          </box>
        )}
        {status && (
          <box
            border={{ type: "line" }}
            style={{ border: { fg: "yellow" } }}
            bottom="0"
            height="0%+3"
            width="100%"
            scrollable
            tags
            content={status}
            index={1}
          />
        )}
        {showHelp && <Help onClose={() => this.setState({ showHelp: false })} />}
      </element>
    )
  }
}

authorize().then((gmail: GmailAPIInstance) => {
  // Creating our screen
  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: "inbox",
    ignoreLocked: ["C-c"],
    fullUnicode: true
  })

  screen.key(["C-c"], function(ch, key) {
    return process.exit(0)
  })

  screen.on("destroy", function() {
    return process.exit(0)
  })

  const gmailApi = {
    threads: {
      list: promisify(gmail.users.threads.list),
      get: promisify(gmail.users.threads.get),
      modify: promisify(gmail.users.threads.modify)
    }
  }

  const component = render(
    <ErrorBoundary>
      <App gmail={gmailApi} screen={screen} />
    </ErrorBoundary>,
    screen
  )
})
