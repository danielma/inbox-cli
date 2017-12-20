import * as React from "react"
import { inspect } from "util"
import settingsEmitter, { Settings } from "./settings"
import * as PropTypes from "prop-types"
import keybindings from "./keybindings"
import { flipArray, padRight } from "./utils"
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
    const height = 20

    return (
      <element
        ref="element"
        border={{ type: "line" }}
        style={{ border: { fg: "green" } }}
        top="center"
        left="center"
        width={50}
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

Keybindings
`}
          {visiblePane === Panes.Help && (
            <Table
              keys
              vi
              mouse
              scrollable
              top={4}
              height={height - 10}
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
          press `q` to close
        </box>
      </element>
    )
  }
}

import { flatMap } from "./utils"
const plugins: IPlugin[] = [require("./plugin-github"), require("./plugin-trello")]
const pluginSettings = flatMap(plugins, p => p.getSettings())

class Preferences extends React.Component<{}, Settings> {
  refs: {
    [key: string]: BlessedReactElementInstance
    form: BlessedFormInstance
  }

  constructor(props) {
    super(props)

    const initialState = {}
    pluginSettings.forEach(s => (initialState[s.name] = s.default))
    this.state = { ...initialState, ...settingsEmitter.load() }
  }

  componentDidMount() {
    this.refs.firstCheckbox.focus()
  }

  handleSubmit = (form, data) => {
    settingsEmitter.save(data)
  }

  handleKeypress = settingName => checkbox => {
    setTimeout(() => {
      this.setState({ [settingName]: checkbox.checked })
    }, 0)
  }

  render() {
    return (
      <form keys vi mouse ref="form" onSubmit={this.handleSubmit}>
        <checkbox
          ref="firstCheckbox"
          mouse
          name="knownOnly"
          checked={this.state.knownOnly}
          onKeypress={this.handleKeypress("knownOnly")}
          text="Only fetch known emails"
        />
        <checkbox
          mouse
          name="useNerdFonts"
          checked={this.state.useNerdFonts}
          text="Use nerd fonts (for icons)"
          onKeypress={this.handleKeypress("useNerdFonts")}
          top={1}
        />
        {pluginSettings.map((setting, index) => (
          <checkbox
            mouse
            name={setting.name}
            checked={!!this.state[setting.name]}
            text={setting.label}
            onKeypress={this.handleKeypress(setting.name)}
            top={index + 2}
          />
        ))}
        <button
          mouse
          top={pluginSettings.length + 4}
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

interface TableProps {
  data: string[][]
  passthroughRef?(BlessedListInstance): void
}

function Table(props: TableProps & BlessedListWithoutItems) {
  const { data, passthroughRef, ...rest } = props
  const flipped = flipArray(data)

  const maxes = flipped.map(c => Math.max(...c.map(x => x.length)))

  return (
    <list
      {...rest}
      ref={passthroughRef}
      items={data.map(row => row.map((column, index) => padRight(column, maxes[index])).join(" "))}
    />
  )
}
