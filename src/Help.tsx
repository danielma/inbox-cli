import * as React from "react"
import { inspect } from "util"

export default class Help extends React.Component<{ onClose(): void }, {}> {
  get box(): BlessedBoxInstance {
    // @ts-ignore
    return this.refs.box
  }

  componentDidMount() {
    this.box.focus()
  }

  handleKeypress = (_ch, key) => {
    const { full } = key

    if (full === "q") {
      this.props.onClose()
    }
  }

  render() {
    return (
      <box
        ref="box"
        border={{ type: "line" }}
        style={{ border: { fg: "green" } }}
        top="center"
        left="center"
        width={50}
        height={20}
        scrollable
        keys
        onKeypress={this.handleKeypress}
        content={"help!\nthis is where you come for help\npress `q` to close"}
      />
    )
  }
}
