import * as fs from "fs"
import * as path from "path"
import { EventEmitter } from "events"
const npmInfo: { name: string } = require("../package.json")

const HOME = require("os").homedir()

const CONFIG_DIR = path.join(HOME, ".config")
const SETTINGS_PATH = path.join(CONFIG_DIR, npmInfo.name, "settings.json")
const SETTINGS_DIR = path.dirname(SETTINGS_PATH)

export interface Settings {
  [key: string]: boolean | string
  knownOnly: boolean
  useNerdFonts: boolean
  threadSortOldestFirst: boolean
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

  let defaultSettings: Settings = {
    knownOnly: false,
    useNerdFonts: false,
    threadSortOldestFirst: true
  }

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
