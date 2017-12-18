import { EventEmitter } from "events"
import * as React from "react"

export {}

declare global {
  interface BlessedReactNode {
    children?: any | null
    ref?: ((BlessedReactNode) => void) | string
  }

  interface BlessedElement extends BlessedReactNode {
    width?: string | number
    height?: string | number
    border?: object
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
    onKeypress?(wut: any, key: object): void
    keys?: boolean
    onBlur?(): void
    shrink?: boolean
  }

  interface BlessedBox extends BlessedElement {}

  interface BlessedList extends BlessedBox {
    items: string[]
    vi?: boolean
    search?(searcher: (value: string) => void): void
    onSelectItem(item: string, index: number): void
    onSelect(item: string, index: number): void
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
    onSubmit?: (data: any) => void
  }

  interface BlessedButtonProps extends BlessedInputProps {
    onPress?: () => void
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
    }
  }
}
