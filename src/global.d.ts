import { EventEmitter } from "events"

export {}

declare global {
  interface BlessedReactNode {
    children?: (JSX.Element | null)[] | string
    ref?(BlessedReactNode): void
  }

  interface BlessedElement extends BlessedReactNode {
    width?: string
    height?: string
    border?: object
    style?: object
    top?: string
    mouse?: boolean
    scrollable?: boolean
  }

  interface BlessedBox extends BlessedElement {}

  interface BlessedList extends BlessedBox {
    items: string[]
    vi?: boolean
    keys?: boolean
    search?(searcher: (value: string) => void): void
    onSelectItem(item: string, index: number): void
    onSelect(item: string, index: number): void
    onKeypress(wut: any, key: object): void
  }

  interface BlessedReactNodeInstance {}

  interface BlessedReactScreenInstance {
    render(): void
  }

  interface BlessedReactElementInstance extends BlessedReactNodeInstance {
    screen: BlessedReactScreenInstance
  }

  interface BlessedListInstance extends BlessedReactElementInstance {
    focus(): void
    selected: number
    up(): void
    down(): void
  }

  namespace JSX {
    interface IntrinsicElements {
      list: BlessedList
      element: BlessedElement
      box: BlessedBox
    }
  }
}
