# Inbox CLI [![Build Status](https://travis-ci.org/danielma/inbox-cli.svg?branch=master)](https://travis-ci.org/danielma/inbox-cli)

A friendly command line interface to gmail.

I use it to keep track of incoming notifications from github and trello in a keyboard-shortcut, developer friendly manner.

[![asciicast](https://asciinema.org/a/P2KZ8YWKjbBcg29pGexcRzdTj.png)](https://asciinema.org/a/P2KZ8YWKjbBcg29pGexcRzdTj?t=5)

## Installing

```
$ npm install --global inbox-cli
$ inbox-cli
```

The first time you run `inbox-cli`, it will use OAuth to authenticate, which means you'll have to open a link in your web browser, login to google, and paste and access code into the application.

Now you're ready to go!

## Usage

Hit `?` in the main view and open help to see the list of keyboard shortcuts!

## Supported platforms

MacOS only for now, since it depends on being able to shell out to `open`.

## Contributions welcome!
