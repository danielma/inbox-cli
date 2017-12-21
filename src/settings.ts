import * as fs from "fs"
import * as path from "path"
import { EventEmitter } from "events"
const npmInfo: { name: string } = require("../package.json")

const HOME = require("os").homedir()

const CONFIG_DIR = path.join(HOME, ".config")
const SETTINGS_PATH = path.join(CONFIG_DIR, npmInfo.name, "settings.json")
const SETTINGS_DIR = path.dirname(SETTINGS_PATH)

export const builtInSettings: ISetting[] = [
  { type: "boolean", name: "knownOnly", label: "Only fetch known emails", default: false },
  { type: "boolean", name: "useNerdFonts", label: "Use nerd fonts for icons", default: false },
  {
    type: "boolean",
    name: "threadSortOldestFirst",
    label: "Sort thread messages by oldest first",
    default: true
  },
  {
    type: "boolean",
    name: "showNotifications",
    label: "Send notifications (using terminal-notifier)",
    default: false
  }
]

export interface Settings {
  [key: string]: boolean
}

function createSettings() {
  try {
    fs.mkdirSync(CONFIG_DIR)
  } catch (err) {
    if (err.code !== "EEXIST") throw err
  }

  try {
    fs.mkdirSync(SETTINGS_DIR)
  } catch (err) {
    if (err.code !== "EEXIST") throw err
  }

  let defaultSettings: Settings = builtInSettings.reduce((memo, setting) => {
    return { ...memo, [setting.name]: setting.default }
  }, {})

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings), { encoding: "utf8" })
}

class SettingsEmitter extends EventEmitter {
  inMemorySettings: Settings | null = null

  load(): Settings {
    if (this.inMemorySettings) return this.inMemorySettings
    if (!fs.existsSync(SETTINGS_PATH)) createSettings()

    const inMemorySettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, { encoding: "utf8" }))
    this.inMemorySettings = inMemorySettings
    return inMemorySettings
  }

  save(settings: Settings) {
    const oldSettings = this.inMemorySettings
    this.inMemorySettings = settings
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(this.inMemorySettings), { encoding: "utf8" })
    this.emit("update", this.inMemorySettings, oldSettings)
  }
}

const emitter = new SettingsEmitter()

export default emitter
