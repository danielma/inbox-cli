import { exec, ChildProcess } from "child_process"

export function openURL(url, { background = false } = {}): ChildProcess {
  const backgroundOption = background ? "-g" : ""
  return exec(`open ${backgroundOption} '${url}'`)
}
