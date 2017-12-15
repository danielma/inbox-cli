import * as React from "react"
import { inspect } from "util"
import settingsEmitter, { Settings } from "./settings"
import * as PropTypes from "prop-types"
const npmInfo: { version: string } = require("../package.json")

enum Panes {
  Preferences,
  Help
}

interface IHelpState {
  visiblePane: Panes
}

export default class Help extends React.Component<{ onClose(): void }, IHelpState> {
  constructor(props) {
    super(props)

    this.state = { visiblePane: Panes.Preferences }
  }

  handleKeypress = (_ch, key) => {
    const { full } = key

    if (full === "q") {
      this.props.onClose()
    }
  }

  render() {
    const { visiblePane } = this.state

    return (
      <element
        ref="element"
        border={{ type: "line" }}
        style={{ border: { fg: "green" } }}
        top="center"
        left="center"
        width={50}
        height={20}
        scrollable
        keys
        onKeypress={this.handleKeypress}
      >
        <listbar
          keys
          mouse
          autoCommandKeys
          style={{ selected: { bg: "green", fg: "black" } }}
          commands={{
            preferences: () => this.setState({ visiblePane: Panes.Preferences }),
            help: () => this.setState({ visiblePane: Panes.Help })
          }}
        />
        <box top={2} width="100%" height="100%-2">
          {visiblePane === Panes.Preferences && <Preferences />}
          {visiblePane === Panes.Help &&
            `Inbox CLI v${npmInfo.version}

This is where you come for help
`}
        </box>
        <line top="100%-4" orientation="horizontal" style={{ type: "line", fg: "green" }} />
        <box top="100%-3" width="100%" height={1}>
          {" "}
          press `q` to close
        </box>
      </element>
    )
  }
}

class Preferences extends React.Component<{}, { settings: Settings }> {
  refs: {
    form: BlessedFormInstance
    firstCheckbox: BlessedInputInstance
  }

  constructor(props) {
    super(props)

    this.state = { settings: settingsEmitter.load() }
  }

  componentDidMount() {
    this.refs.firstCheckbox.focus()
  }

  handleSubmit = data => {
    this.setState({ settings: data }, () => {
      settingsEmitter.save(data)
    })
  }

  render() {
    const { settings } = this.state
    return (
      <form keys vi mouse ref="form" onSubmit={this.handleSubmit}>
        <checkbox
          mouse
          name="knownOnly"
          checked={settings.knownOnly}
          text="Only fetch known emails"
          ref="firstCheckbox"
        />
        <checkbox
          mouse
          name="useNerdFonts"
          checked={settings.useNerdFonts}
          text="Use nerd fonts (for icons)"
          top={1}
        />
        <checkbox
          mouse
          name="useTrelloDesktop"
          checked={settings.useTrelloDesktop}
          text="Open trello links in trello desktop app"
          top={2}
        />
        <button
          mouse
          top={4}
          onPress={() => this.refs.form.submit()}
          border={{ type: "line" }}
          style={{ focus: { bg: "blue", fg: "black", border: { fg: "blue" } } }}
          shrink
          content={"save"}
        />
      </form>
    )
  }
}
