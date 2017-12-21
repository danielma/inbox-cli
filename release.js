var exec = require("child_process").exec
var chalk = require("chalk")
var npmInfo = require("./package")

// main

const version = npmInfo.version

execute("npm publish")
  .then(() => execute(`git tag -a ${version} -m "release ${version}"`))
  .then(() => execute(`git push origin ${version}`))
  .catch(err => console.log(err))

// utils

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
