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
#  UNTAPPD_API_ACCESS_TOKEN - A valid OAuth 2 token
#  UNTAPPD_MAX_COUNT - (optional) Number of results to return
#
# Commands:
#  hubot untappd - Recent friend activity
#  hubot untappd user <query> - Get stats about a particular user
#  hubot untappd beer <query> - Get data about a particular beer
#  hubot untappd brewery <query> - Get data about a particular brewery
#  hubot untappd register - Instructions to register with the bot
#  hubot untappd approve - Approve all pending friend requests
#  hubot untappd friends - List the bot's friends
#  hubot untappd remove <friend> - Remove a friend
#
# Author:
#  sethington, stephenyeargin

count_to_return = process.env.UNTAPPD_MAX_COUNT || 10

module.exports = (robot) ->
  QS = require 'querystring'
  UntappdClient = require 'node-untappd'
  moment = require "moment"

  untappd = new UntappdClient(false);
  untappd.setClientId process.env.UNTAPPD_API_KEY
  untappd.setClientSecret process.env.UNTAPPD_API_SECRET
  untappd.setAccessToken process.env.UNTAPPD_API_ACCESS_TOKEN

  ##
  # Default command
  robot.respond /untappd$/i, (msg) ->
    return unless checkConfiguration msg
    getFriendFeed(msg)

  ##
  # Untappd Search
  robot.respond /untappd (user|brewery|beer) (.+)$/i, (msg) ->
    return unless checkConfiguration msg

    switch msg.match[1].trim()
      when 'user' then getUserData msg.match[2].trim(), msg
      when 'brewery' then getBreweryData msg.match[2].trim(), msg
      when 'beer' then getBeerData msg.match[2].trim(), msg

  ##
  # Untappd Actions
  robot.respond /untappd (register|approve|friends|remove)(\s.*)?$/i, (msg) ->
    return unless checkConfiguration msg

    switch msg.match[1].trim()
      when 'register' then showRegister msg
      when 'friends' then showFriends msg
      when 'approve' then approveRequests msg
      when 'remove' then removeFriend msg

  ##
  # Check Configuration
  checkConfiguration = (msg) ->
    unless untappd.getClientId() && untappd.getClientSecret()
      msg.send 'You are missing required configuration. Be sure to set UNTAPPD_API_KEY and UNTAPPD_API_SECRET.'
      return false
    true

  ##
  # Check Errors
  checkUntappdErrors = (err, obj, msg) ->
    if err
      robot.logger.error err
      msg.send err
      return false
    if obj.meta.error_detail
      robot.logger.error obj
      msg.send "#{obj.meta.code}: #{obj.meta.error_detail}"
      return false
    true

  checkHTTPErrors = (err, res, body, msg) ->
    if err
      robot.logger.error err
      msg.send err
      return false
    if res.statusCode != 200
      robot.logger.error res
      obj = JSON.parse(body)
      msg.send "#{res.statusCode}: #{obj.meta.error_detail}"
      return false
    true

  ##
  # Get Friend Feed
  getFriendFeed = (msg) ->
    untappd.friendFeed (err, obj) ->
      return unless checkUntappdErrors err, obj, msg
      robot.logger.debug obj.response.checkins
      for checkin in obj.response.checkins.items
        time_ago = moment(new Date(checkin.created_at)).fromNow()
        if checkin.venue.venue_name
          msg.send "#{checkin.user.user_name}: #{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} at #{checkin.venue.venue_name} - #{time_ago}"
        else
          msg.send "#{checkin.user.user_name}: #{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} - #{time_ago}"
    , count_to_return

  ##
  # Get User Data
  getUserData = (username, msg) ->
    unless username
      msg.send 'Must provide a username to ask about.'
      return
    untappd.userFeed (err, obj) ->
      return unless checkUntappdErrors err, obj, msg
      robot.logger.debug obj.response.checkins
      if err
        msg.send "Could not retrieve recent checkins for #{username}."
        return
      for checkin in obj.response.checkins.items
        time_ago = moment(new Date(checkin.created_at)).fromNow()
        if checkin.venue.venue_name
          msg.send "#{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} at #{checkin.venue.venue_name} - #{time_ago}"
        else
          msg.send "#{checkin.beer.beer_name} (#{checkin.beer.beer_style} - #{checkin.beer.beer_abv}%) by #{checkin.brewery.brewery_name} - #{time_ago}"
    , username, count_to_return

  ##
  # Get Brewery Data
  getBreweryData = (searchterm, msg) ->
    unless searchterm
      msg.send 'Must provide a brewery name to ask about.'
      return
    untappd.searchBrewery (err, obj) ->
      return unless checkUntappdErrors err, obj, msg
      robot.logger.debug obj.response.beers
      if obj.response.brewery.items.length == 0
        return msg.send "No breweries matched '#{searchterm}'"
      for result in obj.response.brewery.items[0...count_to_return]
        out_msg = result.brewery.brewery_name 
        if (result.brewery.location.brewery_city != "")
          out_msg += " ("+result.brewery.location.brewery_city + ", "+result.brewery.location.brewery_state+")"
        out_msg += " - " + result.brewery.beer_count + " beers (ID: #"+result.brewery.brewery_id+")"

        msg.send out_msg
    , searchterm

  ##
  # Get Beer Data
  getBeerData = (searchterm, msg) ->
    unless searchterm
      msg.send 'Must provide a beer name to ask about.'
      return
    untappd.searchBeer (err, obj) ->
      return unless checkUntappdErrors err, obj, msg
      robot.logger.debug obj.response.beers
      if obj.response.beers.items.length == 0
        return msg.send "No beers matched '#{searchterm}'"
      for result in obj.response.beers.items[0...count_to_return]
        if result.beer.beer_description
          msg.send "#{result.beer.beer_name} (#{result.beer.beer_style} - #{result.beer.beer_abv}%) by #{result.brewery.brewery_name} - #{result.beer.beer_description}"
        else
          msg.send "#{result.beer.beer_name} (#{result.beer.beer_style} - #{result.beer.beer_abv}%) by #{result.brewery.brewery_name}"

    , searchterm

  ##
  # Show Register
  showRegister = (msg) ->
    url = 'https://api.untappd.com/v4/user/info?client_id='+untappd.getClientId()+'&client_secret='+untappd.getClientSecret()+'&access_token='+untappd.getAccessToken()
    msg.http(url)
      .get() (err, res, body) ->
        return unless checkHTTPErrors err, res, body, msg
        robot.logger.debug body
        result = JSON.parse(body)
        msg.send "1) Add #{result.response.user.user_name} as a friend - #{result.response.user.untappd_url}\n2) Type `#{robot.name} untappd approve`"

  ##
  # Show Friends
  showFriends = (msg) ->
    url = 'https://api.untappd.com/v4/user/friends?access_token='+untappd.getAccessToken()
    msg.http(url)
      .get() (err, res, body) ->
        return unless checkHTTPErrors err, res, body, msg
        robot.logger.debug body
        result = JSON.parse(body)
        if result.response.items.length > 0
          friends = []
          for friend in result.response.items
            friends.push "#{friend.user.first_name} #{friend.user.last_name} (#{friend.user.user_name})"
          msg.send friends.join ', '
        else
          msg.send "Your robot has no friends."

  ##
  # Approve Requests
  approveRequests = (msg) ->
    untappd.pendingFriends (err, obj) ->
      return unless checkUntappdErrors err, obj, msg
      robot.logger.debug obj
      if obj.response.items.length > 0
        for result in obj.response.items
          untappd.acceptFriends (err, obj) ->
            return unless checkUntappdErrors err, obj, msg
            friend = obj.response.target_user
            msg.send "Approved: #{friend.first_name} #{friend.last_name} (#{friend.user_name})"
          , result.user.uid
      else
        msg.send "No friends to approve."

  ##
  # Remove Friend
  removeFriend = (msg) ->
    # Get a list of all friends
    username = msg.match[2].trim()
    url = "https://api.untappd.com/v4/user/info/#{username}?access_token=#{untappd.getAccessToken()}"
    msg.http(url)
      .get() (err, res, body) ->
        return unless checkHTTPErrors err, res, body, msg
        result = JSON.parse(body)
        robot.logger.debug result
        msg.send "Removing #{msg.match[2].trim()} ..."
        untappd.removeFriends (err, obj) ->
          return unless checkUntappdErrors err, obj, msg
          user = result.response.user
          msg.send "Removed: #{user.first_name} #{user.last_name} (#{user.user_name})"
        , result.response.user.uid
