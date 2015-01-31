# Description:
#  Untappd data directly from Hubot
#
# Requires:
#  "node-untappd": "~0.2.0"
#  "moment": "~2.5.0"
#
# Configuration:
#  UNTAPPD_API_KEY - Your Untappd API Key
#  UNTAPPD_API_SECRET - Your Untappd API Secret
#  UNATPPD_API_ACCESS_TOKEN - A valid OAuth 2 token
#
# Commands:
#  hubot untappd - Recent friend activity
#  hubot untappd user <query> - Get stats about a particular user
#  hubot untappd beer <query> - Get data about a particular beer
#  hubot untappd brewery <query> - Get data about a particular brewery
#  hubot untappd register - Instructions to register with the bot
#  hubot untappd approve - Approve all pending friend requests
#  hubot untappd friends - List the bot's friends
#
# Author:
#  sethington, stephenyeargin

QS = require 'querystring'
UntappdClient = require 'node-untappd'
moment = require "moment"

untappd = new UntappdClient(false);
untappd.setClientId process.env.UNTAPPD_API_KEY
untappd.setClientSecret process.env.UNTAPPD_API_SECRET
untappd.setAccessToken process.env.UNATPPD_API_ACCESS_TOKEN

module.exports = (robot) ->

  # Default command
  robot.respond /untappd$/i, (msg) ->
    getFriendFeed(msg)

  # Main switch
  robot.respond /untappd (.+) (.+)/i, (msg) ->

    # Verify that we have everything we need
    unless untappd.getClientId() && untappd.getClientSecret()
      msg.send 'You are missing required configuration. Be sure to set UNTAPPD_API_KEY and UNTAPPD_API_SECRET.'
      return

    switch msg.match[1].trim()
      when 'user' then getUserData msg.match[2].trim(), msg
      when 'brewery' then getBreweryData msg.match[2].trim(), msg
      when 'beer' then getBeerData msg.match[2].trim(), msg

  # Single command switch
  robot.respond /untappd (register|approve|friends)/i, (msg) ->

    unless untappd.getClientId() && untappd.getClientSecret()
      msg.send 'You are missing required configuration. Be sure to set UNTAPPD_API_KEY and UNTAPPD_API_SECRET.'
      return

    switch msg.match[1].trim()
      when 'register' then showRegister msg
      when 'friends' then showFriends msg
      when 'approve' then approveRequests msg


getFriendFeed = (msg) ->

  untappd.friendFeed (err, obj) ->
    for checkin in obj.response.checkins.items
      time_ago = moment(new Date(checkin.created_at)).fromNow()
      if checkin.venue.venue_name
        msg.send "#{checkin.user.user_name}: #{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} at #{checkin.venue.venue_name} - #{time_ago}"
      else
        msg.send "#{checkin.user.user_name}: #{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} - #{time_ago}"
  , 5

getUserData = (username, msg) ->

  unless username
    msg.send 'Must provide a username to ask about.'
    return

  untappd.userFeed (err, obj) ->
    unless !err
      msg.send "Could not retrieve recent checkins for #{username}."
      return
    for checkin in obj.response.checkins.items
      time_ago = moment(new Date(checkin.created_at)).fromNow()
      if checkin.venue.venue_name
        msg.send "#{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} at #{checkin.venue.venue_name} - #{time_ago}"
      else
        msg.send "#{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} - #{time_ago}"
  , username, 1

getBreweryData = (searchterm, msg) ->

  unless searchterm
    msg.send 'Must provide a brewery name to ask about.'
    return

  count = 5
  untappd.searchBrewery (err, obj) ->
    unless !err
      msg.send "Could not retrieve brewery info for #{searchterm}."
      return

    for result in obj.response.brewery.items
      if count < 0
        continue
      out_msg = result.brewery.brewery_name 
      if (result.brewery.location.brewery_city != "")
        out_msg += " ("+result.brewery.location.brewery_city + ", "+result.brewery.location.brewery_state+")"
      out_msg += " - " + result.brewery.beer_count + " beers (ID: #"+result.brewery.brewery_id+")"

      msg.send out_msg
      count--
  , searchterm

getBeerData = (searchterm, msg) ->

  unless searchterm
    msg.send 'Must provide a beer name to ask about.'
    return

  count = 5
  untappd.searchBeer (err, obj) ->
    unless !err
      msg.send "Could not retrieve beer info for #{searchterm}."
      return

    for result in obj.response.beers.items
      if count < 0
        continue
      
      if result.beer.beer_description
        msg.send "#{result.beer.beer_name} (#{result.beer.beer_style} - #{result.beer.beer_abv}%) by #{result.brewery.brewery_name} - #{result.beer.beer_description}"
      else
        msg.send "#{result.beer.beer_name} (#{result.beer.beer_style} - #{result.beer.beer_abv}%) by #{result.brewery.brewery_name}"

      count--
  , searchterm

showRegister = (msg) ->

  url = 'https://api.untappd.com/v4/user/info?client_id='+untappd.getClientId()+'&client_secret='+untappd.getClientSecret()+'&access_token='+untappd.getAccessToken()
  msg.http(url)
    .get() (err,res,body) ->
      result = JSON.parse(body)
      msg.send "Friend #{result.response.user.user_name} at #{result.response.user.untappd_url}"

showFriends = (msg) ->

  url = 'https://api.untappd.com/v4/user/friends?access_token='+untappd.getAccessToken()
  msg.http(url)
    .get() (err,res,body) ->
      result = JSON.parse(body)

      if result.response.items.length > 0

        friends = []
        for friend in result.response.items
          friends.push "#{friend.user.first_name} #{friend.user.last_name} (#{friend.user.user_name})"
        msg.send friends.join ', '

      else

        msg.send "Your robot has no friends."


approveRequests = (msg) ->

  untappd.pendingFriends (err, obj) ->

    unless !err
      msg.send "Could not load pending friend requests."
      return

    if obj.response.items.length > 0

      for result in obj.response.items
        untappd.acceptFriends (err, obj) ->
          friend = obj.response.target_user
          msg.send "Approved: #{friend.first_name} #{friend.last_name} (#{friend.user_name})"
        , result.user.uid

    else

      msg.send "No friends to approve."
