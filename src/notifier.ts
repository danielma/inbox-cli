import settings from "./settings"
import { GmailID, GmailThread } from "./gmail-classes"
import { exec, execSync } from "child_process"

let knownThreadIds: { [id: string]: boolean } = {}
let activeNotifications: { [id: string]: boolean } = {}

interface NotifyOptions {
  message: string
  title: string
  subtitle?: string
  id?: string
  activate?: string
}

function notify(options: NotifyOptions) {
  let command = `echo "${options.message}" | terminal-notifier -title "\\${options.title}"`

  if (options.activate) {
    command += ` -activate ${options.activate}`
  }

  if (options.id) {
    command += ` -group ${options.id}`
  }

  exec(command)
}

function removeNotification(options: { id: string }) {
  execSync(`terminal-notifier -remove "${options.id}"`)
}

function notifyThread(thread: GmailThread) {
  activeNotifications[thread.id] = true
  notify({ title: thread.subject, message: `From: ${thread.from}`, id: idForThread(thread) })
}

function idForThread(thread: GmailThread) {
  return `inbox-cli-${thread.id}`
}

export default {
  processNewThreads(oldThreads: GmailThread[], newThreads: GmailThread[]) {
    knownThreadIds = oldThreads.reduce((memo, t) => ({ ...memo, [t.id]: true }), {})

    const threadsThatJustAppeared = newThreads.filter(t => !knownThreadIds[t.id])

    if (settings.load().showNotifications && threadsThatJustAppeared.length > 0) {
      threadsThatJustAppeared.forEach(t => notifyThread(t))
    }
  },

  hideNotification(thread: GmailThread) {
    if (activeNotifications[thread.id]) {
      removeNotification({ id: idForThread(thread) })
      activeNotifications[thread.id] = false
    }
  }
}
