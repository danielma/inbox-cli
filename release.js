var exec = require("child_process").exec
var chalk = require("chalk")
var npmInfo = require("./package")
var readline = require("readline")
var fs = require("fs")

// main

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log(`Current version: ${npmInfo.version}`)

let version = ""

ask("New version: ")
  .then(responseVersion => {
    version = responseVersion.trim()

    return ask(`Confirm: ${version}`)
  })
  .then(() => {
    const newPackage = { ...npmInfo, version }

    fs.writeFileSync("./package.json", JSON.stringify(newPackage, null, 2), { encoding: "utf8" })

    return execute("git add package.json")
  })
  .then(assertGitClean)
  .then(() => execute(`git commit -m v${version}`))
  .then(() => execute(`git push origin master`))
  .then(() => execute(`npm publish`))
  .then(() => execute(`git tag -a v${version} -m "release v${version}"`))
  .then(() => execute(`git push origin v${version}`))
  .then(() => process.exit(0))
  .catch(err => {
    console.log(err)

    process.exit(1)
  })

// utils

function ask(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, function(response) {
      resolve(response)
    })
  })
}

function execute(command) {
  console.log(chalk.magenta("execute: ") + `"${command}"`)
  return new Promise((resolve, reject) => {
    exec(command, function(error, stdout, stderr) {
      if (error) {
        console.log(chalk.red("Whoops!"))
        reject(error)
        return
      }

      console.log(chalk.green("ok! 👍"))
      resolve(stdout)
    }).stdout.pipe(process.stdout)
  })
}

function assertGitClean() {
  return execute("git diff --shortstat 2> /dev/null | tail -n1").then(out => {
    if (out.trim() !== "") {
      throw "Git isn't clean"
    }
  })
}
