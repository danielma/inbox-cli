import { EventEmitter } from "events"
import { GmailMessage } from "./gmail-classes"
import * as React from "react"

export {}

declare global {
  interface BlessedReactNode {
    children?: any | null
    ref?: React.Ref<BlessedReactNodeInstance>
  }

  interface BlessedElement extends BlessedReactNode {
    width?: string | number
    height?: string | number
    border?: object | null
    style?: object
    top?: string | number
    left?: string | number
    bottom?: string
    mouse?: boolean
    scrollable?: boolean
    scrollbar?: object
    tags?: boolean
    content?: string | null
    index?: number
    onKeypress?(node: BlessedReactElementInstance, wut: any, key: object): void
    keys?: boolean
    onBlur?(node: BlessedReactElementInstance): void
    shrink?: boolean
    align?: string
  }

  interface BlessedBox extends BlessedElement {}

  interface BlessedListWithoutItems extends BlessedBox {
    vi?: boolean
    search?(searcher: (value: string) => void): void
    onSelectItem?(node: BlessedListInstance, item: string, index: number): void
    onSelect?(node: BlessedListInstance, item: string, index: number): void
  }

  interface BlessedList extends BlessedListWithoutItems {
    items: string[]
  }

  interface BlessedLineProps extends BlessedBox {
    orientation?: "horizontal" | "vertical"
  }

  interface BlessedListBarProps extends BlessedBox {
    commands: { [key: string]: (() => void) }
    autoCommandKeys?: boolean
  }

  interface BlessedInputProps extends BlessedBox {
    inputOnFocus?: boolean
    name?: string
  }

  interface BlessedTextBoxProps extends BlessedInputProps {}

  interface BlessedCheckboxProps extends BlessedInputProps {
    text: string
    checked?: boolean
  }

  interface BlessedFormProps extends BlessedElement {
    vi?: boolean
    onSubmit?: (form: BlessedFormInstance, data: any) => void
  }

  interface BlessedButtonProps extends BlessedInputProps {
    onPress?: () => void
  }

  interface BlessedTableProps extends BlessedElement {
    data: string[][]
    noCellBorders?: boolean
    pad?: number | null
  }

  interface BlessedReactNodeInstance extends Element {
    focus(): void
    onScreenEvent: (event: string, callback: (...args: any[]) => void) => void
    removeScreenEvent: (event: string, callback: (...args: any[]) => void) => void
  }

  interface BlessedReactScreenInstance {
    render(): void
    key(keys: string[], callback: (ch: string, key: object) => void)
    destroy(): void
    grabKeys: boolean
  }

  interface BlessedReactElementInstance extends BlessedReactNodeInstance {
    screen: BlessedReactScreenInstance
    strWidth(string: string): number
    width: number
    focused: boolean
  }

  interface BlessedBoxInstance extends BlessedReactElementInstance {}

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

  interface BlessedInputInstance extends BlessedReactElementInstance {}

  interface BlessedFormInstance extends BlessedInputInstance {
    submit(): void
  }

  interface BlessedCheckboxInstance extends BlessedInputInstance {
    checked: boolean
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
      listbar: BlessedListBarProps
      line: BlessedLineProps
      checkbox: BlessedCheckboxProps
      form: BlessedFormProps
      button: BlessedButtonProps
      table: BlessedTableProps
    }
  }

  interface IMessageRecognition {
    nerdFontIcon: string
    asciiIcon: string
    externalURL: string
  }

  interface IPlugin {
    recognize(message: GmailMessage): MessageRecognition
    getSettings(): ISetting[]
  }

  type MessageRecognition = IMessageRecognition | void

  interface ISetting {
    type: "boolean" | "string"
    name: string
    label: string
  }
}
