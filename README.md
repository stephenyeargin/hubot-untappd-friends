# Untappd Friends for Hubot

[![npm version](https://badge.fury.io/js/hubot-untappd-friends.svg)](http://badge.fury.io/js/hubot-untappd-friends) [![Node CI](https://github.com/stephenyeargin/hubot-untappd-friends/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hubot-untappd-friends/actions/workflows/nodejs.yml)

Get the latest checkins from your Untappd friends.

## Getting Started

You will first need to go through the process of applying for an API key. This can take anywhere from 2-3 weeks, and you will need to explain for what you intend to use the API key. You can send a link to this page and say you want to use this package.

From here, it can be a little frustrating. [Take a look at the documentation](https://untappd.com/api/docs#authentication). It uses an OAuth1 workflow to send data back the specified endpoint, which you then need to exchange again to get an access token. A free [Runscope](http://runscope.com) account may make things easier because you can create a "bucket" to capture data coming back through the API. You will want to go through the **Server Side Documentation** workflow.

## Installation

In your hubot repository, run:

`npm install hubot-untappd-friends --save`

Then add **hubot-untappd-friends** to your `external-scripts.json`:

```json
["hubot-untappd-friends"]
```

## Configuration:

| Variable                   | Required? | Description                         |
| -------------------------- | :-------: | ----------------------------------- |
| `UNTAPPD_API_KEY`          | Yes       | Client ID for your integration      |
| `UNTAPPD_API_SECRET`       | Yes       | Client Secret for your integration  |
| `UNTAPPD_API_ACCESS_TOKEN` | Yes       | OAuth 2.0 access token              |
| `UNTAPPD_MAX_COUNT`        | No        | Number of beers to show, default: 5 |

## Commands:

- `hubot untappd` - Recent friend activity
- `hubot untappd badges` - Recent friends' badge activity
- `hubot untappd user <query>` - Get stats about a particular user
- `hubot untappd beer <query>` - Get data about a particular beer
- `hubot untappd brewery <query>` - Get data about a particular brewery
- `hubot untappd register` - Instructions to register with the bot
- `hubot untappd approve` - Approve all pending friend requests
- `hubot untappd friends` - List the bot's friends
- `hubot untappd remove <username>` - Remove a friend
