const fs = require("fs")
const readline = require("readline")
const google = require("googleapis")
const googleAuth = require("google-auth-library")
const clientInfo = require("./client-id")
const { inspect } = require("util")
const { openURL } = require("./utils")
const chalk = require("chalk")

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
]
var TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + "/.credentials/"
var TOKEN_PATH = TOKEN_DIR + "inbox-cli-client.json"

function puts(...strings) {
  strings.forEach(s => process.stdout.write(s))
  process.stdout.write("\n")
}

// Load client secrets from a local file.
module.exports = function doTheThing() {
  return new Promise((resolve, reject) => {
    // Authorize a client with the loaded credentials, then call the
    // Gmail API.
    authorize(clientInfo).then(auth => {
      const gmail = google.gmail({ version: "v1", auth })

      resolve(gmail)
    })
  })
}

function sayHello() {
  puts("👋  ", chalk.bold.green("Welcome to inbox-cli!"))
  puts("")
  puts("For inbox-cli to work, it needs to authorize with GMail.")
  puts("")
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  var clientSecret = credentials.installed.client_secret
  var clientId = credentials.installed.client_id
  var redirectUrl = credentials.installed.redirect_uris[0]
  var auth = new googleAuth()
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl)

  // Check if we have previously stored a token.
  return new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        if (err.code !== "ENOENT") puts(inspect(err))

        sayHello()

        getNewToken(oauth2Client).then(resolve)
      } else {
        oauth2Client.credentials = JSON.parse(token)
        resolve(oauth2Client)
      }
    })
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 *     client.
 */
function getNewToken(oauth2Client) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  })

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })

    rl.question("Press enter to open the OAuth authorization screen", function() {
      openURL(authUrl)

      rl.question("Enter the code from that page here: ", function(code) {
        rl.close()
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            puts("Error while trying to retrieve access token", err)
            reject(err)
            return
          }
          oauth2Client.credentials = token
          storeToken(token)
          resolve(oauth2Client)
        })
      })
    })
  })
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR)
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token))
  puts("Token stored to " + TOKEN_PATH)
}
