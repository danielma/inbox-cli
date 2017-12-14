import * as React from "react"
import { inspect } from "util"

export default class ErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ error: error })
  }

  render() {
    if (this.state.error) {
      // You can render any custom fallback UI
      return (
        <box width="100%" height="100%">
          {inspect(this.state.error)}
        </box>
      )
    }
    return this.props.children
  }
}
