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
    const trimmedString = string.slice(0, padding - 1)
    return withRightAlignedText(trimmedString, { right, list })
  } else {
    return string + " ".repeat(padding) + right
  }
}

enum DateFormatMode {
  Normal
}

interface formatDateOptions {
  mode: DateFormatMode
}

export function formatDate(
  date: Date,
  { mode }: formatDateOptions = { mode: DateFormatMode.Normal }
) {
  if (mode === DateFormatMode.Normal) {
    const minutes = date.getMinutes()
    const displayMinutes = minutes >= 10 ? `${minutes}` : `0${minutes}`

    const hours = date.getHours()
    const displayHours = hours >= 10 ? `${hours}` : ` ${hours}`
    const month = date.getMonth() + 1
    const displayMonth = month >= 10 ? `${month}` : ` ${month}`
    const dateDate = date.getDate()
    const displayDate = dateDate >= 10 ? `${dateDate}` : `0${dateDate}`

    return `${displayMonth}/${displayDate} ${displayHours}:${displayMinutes}`
  } else {
    throw `Uknown mode: ${mode}`
  }
}

export function promisify(
  fn: (options: object, cb: (err, response) => void) => void
): (options: object) => Promise<any> {
  return function promisedFn(options) {
    return new Promise((resolve, reject) => {
      fn(options, (err, response) => {
        if (err) {
          reject(err)
        }
        resolve(response)
      })
    })
  }
}

export function flipArray<T>(array: T[][]): T[][] {
  if (array.length === 0) return []

  let output: T[][] = []

  const columnCount = array[0].length
  let index = 0

  while (index < columnCount) {
    output.push([])
    index += 1
  }

  array.forEach(row => {
    row.forEach((column, index) => {
      output[index].push(column)
    })
  })

  return output
}

export function padRight(string: string, length: number, spacer?: string): string {
  if (spacer) {
    return pad(string, length, PadDirection.right, spacer)
  } else {
    return pad(string, length, PadDirection.right)
  }
}

export function padLeft(string: string, length: number, spacer?: string): string {
  if (spacer) {
    return pad(string, length, PadDirection.left, spacer)
  } else {
    return pad(string, length, PadDirection.left)
  }
}

enum PadDirection {
  left,
  right
}

function pad(
  string: string,
  length: number,
  direction: PadDirection,
  spacer: string = " "
): string {
  const stringLength = string.length
  const spaceNeeded = length - stringLength

  if (spaceNeeded < 1) return string

  if (direction === PadDirection.left) {
    return `${spacer.repeat(spaceNeeded)}${string}`
  } else if (direction === PadDirection.right) {
    return `${string}${spacer.repeat(spaceNeeded)}`
  } else {
    throw "wat"
  }
}

// https://gist.github.com/samgiles/762ee337dff48623e729

export function flatMap<T, U>(array: T[], mapFunc: (x: T) => U[]): U[] {
  return array.reduce((cumulus: U[], next: T) => [...mapFunc(next), ...cumulus], <U[]>[])
}
