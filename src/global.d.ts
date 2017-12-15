import { EventEmitter } from "events"

export {}

declare global {
  interface BlessedReactNode {
    children?: any | null
    ref?(BlessedReactNode): void
  }

  interface BlessedElement extends BlessedReactNode {
    width?: string | number
    height?: string | number
    border?: object
    style?: object
    top?: string
    left?: string | number
    bottom?: string
    mouse?: boolean
    scrollable?: boolean
    scrollbar?: object
    tags?: boolean
    content?: string | null
    index?: number
    onKeypress?(wut: any, key: object): void
    keys?: boolean
    onBlur?(): void
  }

  interface BlessedBox extends BlessedElement {}

  interface BlessedList extends BlessedBox {
    items: string[]
    vi?: boolean
    search?(searcher: (value: string) => void): void
    onSelectItem(item: string, index: number): void
    onSelect(item: string, index: number): void
  }

  interface BlessedInputProps extends BlessedBox {
    inputOnFocus?: boolean
  }

  interface BlessedTextBoxProps extends BlessedInputProps {}

  interface BlessedReactNodeInstance {}

  interface BlessedReactScreenInstance {
    render(): void
  }

  interface BlessedReactElementInstance extends BlessedReactNodeInstance {
    screen: BlessedReactScreenInstance
    strWidth(string: string): number
    width: number
    focus(): void
    focused: boolean
  }

  interface BlessedListInstance extends BlessedReactElementInstance {
    selected: number
    up(): void
    down(): void
    select(index: number): void
    items: string[]
  }

  interface BlessedTextBoxInstance extends BlessedReactElementInstance {
    value: string
    setValue(value: string): void
  }

  interface GmailAPIInstance {
    users: {
      threads: {
        list(options: object, cb: (err, response) => void): void
        get(options: object, cb: (err, response) => void): void
        modify(options: object, cb: (err, response) => void): void
      }
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      list: BlessedList
      element: BlessedElement
      box: BlessedBox
      textbox: BlessedTextBoxProps
    }
  }
}
