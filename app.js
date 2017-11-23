import React from "react";
import blessed from "blessed";
import { render } from "react-blessed";
import authorize from "./authorize";
import google from "googleapis";
import googleAuth from "google-auth-library";
import { exec } from "child_process";

const gmail = google.gmail("v1");

class GmailMessage {
  constructor(message) {
    this._message = message;
    // console.log(message);
    this._headers = {};
    this._headers = message.payload.headers.reduce((memo, header) => {
      memo[header.name.toLowerCase()] = header.value;
      return memo;
    }, {});
    this.payload = message.payload;
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

function openURL(url, { background = false } = {}) {
  const backgroundOption = background ? "-g" : "";
  exec(`open ${backgroundOption} ${url}`);
}

class App extends React.Component {
  state = { messages: [], selectedMessage: null };

  componentDidMount() {
    const { auth } = this.props;
    const userId = "me";
    listThreads({
      auth,
      userId,
      labelIds: ["INBOX"]
    })
      .then(({ threads }) => {
        return Promise.all(
          threads.map(thread => {
            return getThread({ auth, userId, id: thread.id });
          })
        );
      })
      .then(threads =>
        threads.reduce((memo, thread) => memo.concat(thread.messages), [])
      )
      .then(messages => messages.map(m => new GmailMessage(m)))
      .then(messages => this.setState({ messages }));

    this.refs.messageList.focus();
  }

  handleMessageSelected = message => {
    this.setState({ selectedMessage: message });
  };

  render() {
    return (
      <element>
        <list
          width="100%"
          height="20%"
          border={{ type: "line" }}
          style={{ border: { fg: "blue" }, selected: { bg: "gray" } }}
          items={this.state.messages.map(m => m.subject)}
          vi
          keys
          mouse
          onSelect={(_item, index) => {
            this.handleMessageSelected(this.state.messages[index]);
          }}
          onKeypress={(_ch, key) => {
            if (key.full === "C-o") {
              const selected = this.refs.messageList.selected;
              openURL(this.state.messages[selected].externalURL, {
                background: true
              });
            } else if (key.full === "C-l") {
              const selected = this.refs.messageList.selected;
              openURL(this.state.messages[selected].externalURL);
            }
          }}
          ref="messageList"
        />
        <box
          border={{ type: "line" }}
          style={{ border: { fg: "blue" }, selected: { bg: "gray" } }}
          top="20%"
          height="80%"
          width="100%"
        >
          {this.state.selectedMessage && this.state.selectedMessage.plainText}
        </box>
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
