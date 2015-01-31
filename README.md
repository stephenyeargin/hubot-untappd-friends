# Untappd Friends for Hubot [![Build Status](https://travis-ci.org/hubot-scripts/hubot-untappd-friends.svg?branch=master)](https://travis-ci.org/hubot-scripts/hubot-untappd-friends)

Untappd data directly from Hubot.

# Commands:

- `hubot untappd` - Recent friend activity
- `hubot untappd user <query>` - Get stats about a particular user
- `hubot untappd beer <query>` - Get data about a particular beer
- `hubot untappd brewery <query>` - Get data about a particular brewery
- `hubot untappd register` - Instructions to register with the bot
- `hubot untappd approve` - Approve all pending friend requests
- `hubot untappd friends` - List the bot's friends

## Configuration:

### Heroku

```
heroku config:set UNTAPPD_API_KEY=<Your Untappd API Key>
heroku config:set UNTAPPD_API_SECRET=<Your Untappd API Secret>
heroku config:set UNATPPD_API_ACCESS_TOKEN=<A valid OAuth 2 token>
```

### Other

```
export UNTAPPD_API_KEY=<Your Untappd API Key>
export UNTAPPD_API_SECRET=<Your Untappd API Secret>
export UNATPPD_API_ACCESS_TOKEN=<A valid OAuth 2 token>
```

## Adding to Your Hubot

See full instructions [here](https://github.com/github/hubot/blob/master/docs/scripting.md#npm-packages).

1. `npm install hubot-untappd-friends --save` (updates your `package.json` file)
2. Open the `external-scripts.json` file in the root directory (you may need to create this file) and add an entry to the array (e.g. `["hubot-untappd-friends"]`).
