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
  refs: {
    element: BlessedReactNodeInstance
  }

  constructor(props) {
    super(props)

    this.state = { visiblePane: Panes.Preferences }
  }

  componentDidMount() {
    this.refs.element.onScreenEvent("keypress", this.handleScreenKeypress)
  }

  componentWillUnmount() {
    this.refs.element.removeScreenEvent("keypress", this.handleScreenKeypress)
  }

  handleScreenKeypress = (_ch, key) => {
    if (key.full === "q") {
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

class Preferences extends React.Component<{}, Settings> {
  refs: {
    form: BlessedFormInstance
    knownOnlyCheckbox: BlessedCheckboxInstance
    useNerdFontsCheckbox: BlessedCheckboxInstance
    useTrelloDesktopCheckbox: BlessedCheckboxInstance
  }

  constructor(props) {
    super(props)

    this.state = settingsEmitter.load()
  }

  componentDidMount() {
    this.refs.knownOnlyCheckbox.focus()
  }

  handleSubmit = data => {
    this.setState({ ...data }, () => {
      settingsEmitter.save(data)
    })
  }

  handleKeypress = settingName => () => {
    setTimeout(() => {
      this.setState({ [settingName]: this.refs[settingName + "Checkbox"].checked })
    }, 0)
  }

  render() {
    return (
      <form keys vi mouse ref="form" onSubmit={this.handleSubmit}>
        <checkbox
          ref="knownOnlyCheckbox"
          mouse
          name="knownOnly"
          checked={this.state.knownOnly}
          onKeypress={this.handleKeypress("knownOnly")}
          text="Only fetch known emails"
        />
        <checkbox
          ref="useNerdFontsCheckbox"
          mouse
          name="useNerdFonts"
          checked={this.state.useNerdFonts}
          text="Use nerd fonts (for icons)"
          onKeypress={this.handleKeypress("useNerdFonts")}
          top={1}
        />
        <checkbox
          ref="useTrelloDesktopCheckbox"
          mouse
          name="useTrelloDesktop"
          checked={this.state.useTrelloDesktop}
          text="Open trello links in trello desktop app"
          onKeypress={this.handleKeypress("useTrelloDesktop")}
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
