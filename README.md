# Untappd Friends for Hubot

[![npm version](https://badge.fury.io/js/hubot-untappd-friends.svg)](http://badge.fury.io/js/hubot-untappd-friends) [![Node CI](https://github.com/stephenyeargin/hubot-untappd-friends/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hubot-untappd-friends/actions/workflows/nodejs.yml)

Get the latest check-ins from your Untappd friends.

## Getting Started

> [!NOTE]
> As of January 2024, the Untappd API is still not accepting new applications. :cry:

You will first need to go through the process of applying for an API key. This can take anywhere from 2-3 weeks, and you will need to explain for what you intend to use the API key. You can send a link to this page and say you want to use this package.

From here, it can be a little frustrating. [Take a look at the documentation](https://untappd.com/api/docs#authentication). It uses an OAuth1 workflow to send data back the specified endpoint, which you then need to exchange again to get an access token. [Postman](https://www.postman.com/) is a great tool to generate the `UNTAPPD_API_ACCESS_TOKEN` by plugging in your API credentials.

## Installation

In your hubot repository, run:

`npm install hubot-untappd-friends --save`

Then add **hubot-untappd-friends** to your `external-scripts.json`:

```json
["hubot-untappd-friends"]
```

## Configuration:

| Variable                         | Required? | Description                                                      |
| -------------------------------- | :-------: | ---------------------------------------------------------------- |
| `UNTAPPD_API_KEY`                | Yes       | Client ID for your integration                                   |
| `UNTAPPD_API_SECRET`             | Yes       | Client Secret for your integration                               |
| `UNTAPPD_API_ACCESS_TOKEN`       | Yes       | OAuth 2.0 access token                                           |
| `UNTAPPD_MAX_COUNT`              | No        | Number of beers to show; default: `5`                            |
| `UNTAPPD_MAX_DESCRIPTION_LENGTH` | No        | Where to truncate long descriptions, `0` to hide; default: `150` |
| `UNTAPPD_MAX_RANDOM_ID`          | No        | Maximum value to use for random beer command                     |

## Commands:

- `hubot untappd` - Recent friend activity
- `hubot untappd badges` - Recent friends' badge activity
- `hubot untappd user <username>` - Get stats about a particular user
- `hubot untappd beer random` - Retrieve a random beer
- `hubot untappd beer <query|ID>` - Get data about a particular beer
- `hubot untappd brewery <query>` - Get data about a particular brewery
- `hubot untappd toast` - Have the bot toast the most recent checkin from each user in activity feed
- `hubot untappd toast <username>` - Have the bot toast user's most recent checkin
- `hubot untappd register` - Instructions to register with the bot
- `hubot untappd approve` - Approve all pending friend requests
- `hubot untappd friends` - List the bot's friends
- `hubot untappd remove <username>` - Remove a friend
