import { exec, ChildProcess } from "child_process"

export function openURL(url, { background = false } = {}): ChildProcess {
  const backgroundOption = background ? "-g" : ""
  return exec(`open ${backgroundOption} '${url}'`)
}

interface WithRightOptions {
  right: string
  list: BlessedListInstance | null
}

export function withRightAlignedText(string: string, { right, list }: WithRightOptions) {
  if (!list) return string

  const { width } = list

  if (width < 1) return string

  const stringWidth = list.strWidth(string)
  const rightWidth = list.strWidth(right)

  const padding = width - stringWidth - rightWidth - 4

  if (padding < 1) {
    return string
  } else {
    return string + " ".repeat(padding) + right
  }
}
