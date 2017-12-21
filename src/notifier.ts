import settings from "./settings"
import { GmailID, GmailThread } from "./gmail-classes"
import { exec } from "child_process"

let knownThreadIds: { [id: string]: boolean } = {}

export default {
  processNewThreads(oldThreads: GmailThread[], newThreads: GmailThread[]) {
    knownThreadIds = oldThreads.reduce((memo, t) => ({ ...memo, [t.id]: true }), {})

    const threadsThatJustAppeared = newThreads.filter(t => !knownThreadIds[t.id])

    if (settings.load().showNotifications && threadsThatJustAppeared.length > 0) {
      threadsThatJustAppeared.forEach(t => {
        exec(`echo "From: ${t.from}" | terminal-notifier -title "\\${t.subject}"`)
      })
    }
  }
}
