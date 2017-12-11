import React from "react";
import blessed from "blessed";
import { render } from "react-blessed/dist/fiber/fiber";
import authorize from "./authorize";
import google from "googleapis";
import googleAuth from "google-auth-library";
import { exec } from "child_process";
import { inspect } from "util";

const gmail = google.gmail("v1");

class GmailThread {
  constructor(thread) {
    this._thread = thread;

    this.messages = thread.messages.map(message => new GmailMessage(message));
    this.snippet = this._thread.snippet;
  }
}

class GmailMessage {
  constructor(message) {
    this._message = message;
    this._headers = {};
    this._headers = message.payload.headers.reduce((memo, header) => {
      memo[header.name.toLowerCase()] = header.value;
      return memo;
    }, {});
    this.payload = message.payload;
  }

  get id() {
    return this._message.id;
  }

  get threadId() {
    return this._message.threadId;
  }

  get subject() {
    return this._headers["subject"];
  }

  get plainText() {
    const { parts } = this._message.payload;
    const plainText = parts.find(p => p.mimeType === "text/plain") || parts[0];
    return new Buffer(plainText.body.data, "base64").toString("utf8");
  }

  get externalURL() {
    return this.githubURL;
  }

  get githubURL() {
    const match = this.plainText.match(/github:\s+(http.+)/im);

    return match && match[1];
  }
}

function promisify(fn) {
  return function promisedFn(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, response) => {
        if (err) {
          reject(err);
        }
        resolve(response);
      });
    });
  };
}

const listThreads = promisify(gmail.users.threads.list);
const getThread = promisify(gmail.users.threads.get);
const modifyThread = promisify(gmail.users.threads.modify);

function openURL(url, { background = false } = {}) {
  const backgroundOption = background ? "-g" : "";
  exec(`open ${backgroundOption} ${url}`);
}

class App extends React.Component {
  state = {
    threads: [],
    selectedIndex: null,
    error: null,
    lastArchivedThreadId: null
  };

  componentDidMount() {
    this.reloadInbox();
    this.refs.messageList.focus();
    this.setupReloadInterval();
  }

  setupReloadInterval = () => {
    setInterval(this.reloadInbox, 30000);
  };

  reloadInbox = () => {
    this.setState({ error: "loading" });
    const { auth } = this.props;
    const userId = "me";
    return listThreads({
      auth,
      userId,
      labelIds: ["INBOX"]
    })
      .then(({ threads }) => {
        return Promise.all(
          (threads || []).map(thread => {
            return getThread({ auth, userId, id: thread.id });
          })
        );
      })
      .then(threads => threads.map(t => new GmailThread(t)))
      .then(threads => this.setState({ threads, error: null }));
  };

  handleMessageListKeypress = (_ch, key) => {
    const { full } = key;
    const { messageList } = this.refs;
    const { messages } = this;
    const selectedMessage = messages[messageList.selected];
    if (full === "C-o") {
      openURL(selectedMessage.externalURL, {
        background: true
      });
    } else if (full === "C-d") {
      modifyThread({
        auth: this.props.auth,
        userId: "me",
        id: selectedMessage.threadId,
        resource: { removeLabelIds: ["INBOX"] }
      }).then(thread => {
        this.setState({ lastArchivedThreadId: thread.id });
        this.reloadInbox();
      }, this.logError);
    } else if (full === "C-p") {
      messageList.up();
      messageList.screen.render();
    } else if (full === "C-n") {
      messageList.down();
      messageList.screen.render();
    } else if (full === "C-z" && this.state.lastArchivedThreadId) {
      modifyThread({
        auth: this.props.auth,
        userId: "me",
        id: this.state.lastArchivedThreadId,
        resource: { addLabelIds: ["INBOX"] }
      }).then(_thread => {
        this.setState({ lastArchivedThreadId: null });
        this.reloadInbox();
      }, this.logError);
    }
  };

  logError = error => {
    this.setState({ error });
  };

  get messages() {
    return this.state.threads.reduce((memo, thread) => {
      return memo.concat(thread.messages);
    }, []);
  }

  get messageSubjects() {
    return this.state.threads.reduce((memo, thread) => {
      const firstSubject = thread.messages[0].subject;
      const restSubjects = thread.messages.slice(1).map(m => `  ${m.subject}`);

      return memo.concat([firstSubject, ...restSubjects]);
    }, []);
  }

  render() {
    const { error } = this.state;
    const { messages, messageSubjects } = this;
    const selectedMessage =
      this.state.selectedIndex && messages[this.state.selectedIndex];

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
            this.setState({ selectedIndex: index });
          }}
          onSelect={(_item, index) => {
            openURL(messages[index].externalURL);
          }}
          onKeypress={this.handleMessageListKeypress}
          ref="messageList"
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
    );
  }
}

authorize().then(auth => {
  // Creating our screen
  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: "inbox"
  });

  // Adding a way to quit the program
  screen.key(["q", "C-c"], function(ch, key) {
    return process.exit(0);
  });

  const component = render(<App auth={auth} />, screen);
});
