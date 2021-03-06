import * as React from "react"
import { inspect } from "util"
import settingsEmitter, { Settings, builtInSettings } from "./settings"
import * as PropTypes from "prop-types"
import keybindings from "./keybindings"
import ListTable from "./ListTable"
const npmInfo: { version: string; bugs: { url: string } } = require("../package.json")

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

  keybindingsTable: BlessedListInstance

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

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.visiblePane !== Panes.Help && this.state.visiblePane === Panes.Help) {
      this.keybindingsTable.focus()
    }
  }

  handleScreenKeypress = (_ch, key) => {
    if (key.full === "q") {
      this.props.onClose()
    }
  }

  render() {
    const { visiblePane } = this.state
    const height = 25

    return (
      <element
        ref="element"
        border={{ type: "line" }}
        style={{ border: { fg: "green" } }}
        top="center"
        left="center"
        width={70}
        height={height}
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

Issues: ${npmInfo.bugs.url}

Keybindings
`}
          {visiblePane === Panes.Help && (
            <ListTable
              keys
              vi
              mouse
              scrollable
              top={6}
              height={height - 12}
              scrollbar={{ style: { bg: "white" }, track: { bg: "gray" } }}
              data={Object.keys(keybindings).map(k => [k, keybindings[k]])}
              passthroughRef={list => (this.keybindingsTable = list)}
              style={{
                selected: { bg: "gray" }
              }}
            />
          )}
        </box>
        <line top="100%-4" orientation="horizontal" style={{ type: "line", fg: "green" }} />
        <box top="100%-3" width="100%" height={1}>
          {" "}
          press `q` to close this modal
        </box>
      </element>
    )
  }
}

import { flatMap } from "./utils"
const plugins: IPlugin[] = [require("./plugin-github"), require("./plugin-trello")]
const pluginSettings = flatMap(plugins, p => p.getSettings())
const allSettings = [...builtInSettings, ...pluginSettings]

class Preferences extends React.Component<{}, Settings> {
  refs: {
    form: BlessedFormInstance
  }

  constructor(props) {
    super(props)

    const initialState = {}
    allSettings.forEach(s => (initialState[s.name] = s.default))
    this.state = { ...initialState, ...settingsEmitter.load() }
  }

  componentDidMount() {
    this.refs.form.children[0].focus()
  }

  handleSubmit = (form, data) => {
    settingsEmitter.save(data)
  }

  handleCheckboxKeypress = checkbox => {
    setTimeout(() => {
      this.setState({ [checkbox.name]: checkbox.checked })
    }, 0)
  }

  render() {
    return (
      <form keys vi mouse ref="form" onSubmit={this.handleSubmit}>
        {allSettings.map((setting, index) => (
          <checkbox
            mouse
            name={setting.name}
            checked={!!this.state[setting.name]}
            text={setting.label}
            onKeypress={this.handleCheckboxKeypress}
            top={index}
          />
        ))}
        <button
          mouse
          top={allSettings.length + 2}
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
