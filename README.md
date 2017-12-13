# Inbox CLI

A friendly command line interface to gmail.

I use it to keep track of incoming notifications from github and trello in a keyboard-shortcut, developer friendly manner.

## Installing

```
$ npm install --global inbox-cli
$ inbox-cli
```

The first time you run `inbox-cli`, it will use OAuth to authenticate, which means you'll have to open a link in your web browser, login to google, and paste and access code into the application.

Now you're ready to go!

## Usage

|Keys|Function|
|-|-|
|`C-o`|Open the current item in the background|
|`Enter`, `l`|Open the current item in the foreground|
|`C-p`, `k`, `up`|Up|
|`C-n`, `j`, `down`|Down|

## Supported platforms

MacOS only for now, since it depends on being able to shell out to `open`.

## Contributions welcome!
