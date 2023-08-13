// Description:
//  Untappd data directly from Hubot
//
// Configuration:
//  UNTAPPD_API_KEY - Your Untappd API Key
//  UNTAPPD_API_SECRET - Your Untappd API Secret
//  UNTAPPD_API_ACCESS_TOKEN - A valid OAuth 2 token
//  UNTAPPD_MAX_COUNT - (optional) Number of results to return
//  UNTAPPD_MAX_DESCRIPTION_LENGTH - Where to truncate long descriptions, `0` to hide.
//  UNTAPPD_MAX_RANDOM_ID - Maximum value to use for random beer command.
//
// Commands:
//  hubot untappd - Recent friend activity
//  hubot untappd badges - Recent friends' badge activity
//  hubot untappd user <username> - Get stats about a particular user
//  hubot untappd beer random - Retrieve a random beer
//  hubot untappd beer <query|ID> - Get data about a particular beer
//  hubot untappd brewery <query> - Get data about a particular brewery
//  hubot untappd register - Instructions to register with the bot
//  hubot untappd approve - Approve all pending friend requests
//  hubot untappd friends - List the bot's friends
//  hubot untappd remove <username> - Remove a friend
//
// Author:
//  sethington, stephenyeargin

const UntappdClient = require('node-untappd');
const moment = require('moment');

module.exports = (robot) => {
  let maxDescriptionLength;

  const countToReturn = process.env.UNTAPPD_MAX_COUNT || 5;
  const maxRandomBeerId = process.env.UNTAPPD_MAX_RANDOM_ID || 5485000;
  if (typeof process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH === 'undefined') {
    maxDescriptionLength = 150;
  } else {
    maxDescriptionLength = parseInt(process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH, 10);
  }

  const untappd = new UntappdClient(false);
  untappd.setClientId(process.env.UNTAPPD_API_KEY);
  untappd.setClientSecret(process.env.UNTAPPD_API_SECRET);
  untappd.setAccessToken(process.env.UNTAPPD_API_ACCESS_TOKEN);

  // Check Configuration
  const checkConfiguration = (msg) => {
    if (!untappd.getClientId() || !untappd.getClientSecret()) {
      msg.send('You are missing required configuration. Be sure to set UNTAPPD_API_KEY and UNTAPPD_API_SECRET.');
      return false;
    }
    return true;
  };

  // Check Untappd Errors
  const checkUntappdErrors = (err, obj, msg) => {
    if (err) {
      robot.logger.error(err);
      msg.send(err);
      return false;
    }
    if (obj.meta.error_detail) {
      robot.logger.error(obj);
      msg.send(`${obj.meta.code}: ${obj.meta.error_detail}`);
      return false;
    }
    return true;
  };

  // Check HTTP Errors
  const checkHTTPErrors = (err, res, body, msg) => {
    if (err) {
      robot.logger.error(err);
      msg.send(err);
      return false;
    }
    if (res.statusCode !== 200) {
      robot.logger.error(res);
      const obj = JSON.parse(body);
      msg.send(`${res.statusCode}: ${obj.meta.error_detail}`);
      return false;
    }
    return true;
  };

  // Short Beer Description
  const formatShortDescription = (beerDescription) => {
    const shortDescription = beerDescription.replace(/\r?\n|\r/g, '').trim();
    return shortDescription.substr(0, maxDescriptionLength - 1) + ((shortDescription.length > maxDescriptionLength ? ' ...' : ''));
  };

  // Get Friend Feed
  const getFriendFeed = (msg) => untappd.activityFeed(
    (err, obj) => {
      let chunk;
      if (!checkUntappdErrors(err, obj, msg)) {
        return;
      }
      robot.logger.debug(obj.response.checkins);
      const contents = [];
      obj.response.checkins.items.forEach((checkin) => {
        let firstBadge;
        chunk = {
          title: `${checkin.user.first_name} (${checkin.user.user_name}) was drinking ${checkin.beer.beer_name} by ${checkin.brewery.brewery_name}`,
          title_link: `https://untappd.com/user/${checkin.user.user_name}/checkin/${checkin.checkin_id}`,
          thumb_url: `${checkin.beer.beer_label}`,
          color: '#7CD197',
        };

        const timeAgo = moment(new Date(checkin.created_at)).fromNow();
        if (checkin.venue.venue_name) {
          chunk.author_name = `${timeAgo} at ${checkin.venue.venue_name}`;
          chunk.fallback = `${checkin.user.first_name} (${checkin.user.user_name}) was drinking ${checkin.beer.beer_name} (${checkin.beer.beer_style} - ${checkin.beer.beer_abv}%) by ${checkin.brewery.brewery_name} at ${checkin.venue.venue_name} - ${timeAgo}`;
        } else {
          chunk.author_name = `${timeAgo}`;
          chunk.fallback = `${checkin.user.first_name} (${checkin.user.user_name}) was drinking ${checkin.beer.beer_name} (${checkin.beer.beer_style} - ${checkin.beer.beer_abv}%) by ${checkin.brewery.brewery_name} - ${timeAgo}`;
        }

        if (checkin.badges.count === 1) {
          [firstBadge] = checkin.badges.items;
          chunk.footer = `Earned the ${firstBadge.badge_name} badge`;
          chunk.footer_icon = `${firstBadge.badge_image.sm}`;
        }
        if (checkin.badges.count > 1) {
          [firstBadge] = checkin.badges.items;
          const otherBadges = checkin.badges.count - 1;
          chunk.footer = `Earned the ${firstBadge.badge_name} badge and ${otherBadges} more`;
          chunk.footer_icon = `${firstBadge.badge_image.sm}`;
        }
        contents.push(chunk);
      });

      // Slack formatting
      if (/slack/i.test(robot.adapterName)) {
        robot.messageRoom(msg.message.room, { attachments: contents, unfurl_links: false });
        return;
      }
      contents.forEach((chunkToSend) => {
        msg.send(chunkToSend.fallback);
      });
    },
    { limit: countToReturn },
  );

  // Get Badge Feed
  const getBadgeFeed = (msg) => untappd.activityFeed(
    (err, obj) => {
      let chunk;
      if (!checkUntappdErrors(err, obj, msg)) {
        return;
      }
      robot.logger.debug(obj.response.checkins);
      const contents = [];
      obj.response.checkins.items.forEach((checkin) => {
        const timeAgo = moment(new Date(checkin.created_at)).fromNow();
        checkin.badges.items.forEach((badge) => {
          chunk = {
            title: `${checkin.user.first_name} (${checkin.user.user_name}) earned the ${badge.badge_name} Badge`,
            title_link: `https://untappd.com/user/${checkin.user.user_name}/checkin/${checkin.checkin_id}`,
            thumb_url: `${badge.badge_image.sm}`,
            footer: `${checkin.beer.beer_name}`,
            footer_icon: `${checkin.beer.beer_label}`,
            color: '#7CD197',
          };
          if (checkin.venue.venue_name) {
            chunk.author_name = `${timeAgo} at ${checkin.venue.venue_name}`;
            chunk.fallback = `${checkin.user.first_name} (${checkin.user.user_name}) earned the ${badge.badge_name} Badge after drinking a ${checkin.beer.beer_name} at ${checkin.venue.venue_name} - ${timeAgo}`;
          } else {
            chunk.author_name = `${timeAgo}`;
            chunk.fallback = `${checkin.user.first_name} (${checkin.user.user_name}) earned the ${badge.badge_name} Badge after drinking a ${checkin.beer.beer_name} - ${timeAgo}`;
          }

          contents.push(chunk);
        });
      });

      if (robot.adapterName === 'slack') {
        robot.messageRoom(msg.message.room, { attachments: contents, unfurl_links: false });
        return;
      }
      contents.forEach((chunkToSend) => {
        msg.send(chunkToSend.fallback);
      });
    },
    { limit: countToReturn },
  );

  // Get User Data
  const getUserData = (username, msg) => {
    if (!username) {
      msg.send('Must provide a username to ask about.');
      return;
    }
    untappd.userActivityFeed(
      (err, obj) => {
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        robot.logger.debug(obj.response.checkins);
        if (err) {
          msg.send(`Could not retrieve recent checkins for ${username}.`);
          return;
        }
        obj.response.checkins.items.forEach((checkin) => {
          const timeAgo = moment(new Date(checkin.created_at)).fromNow();
          if (checkin.venue.venue_name) {
            msg.send(`${checkin.beer.beer_name} (${checkin.beer.beer_style} - ${checkin.beer.beer_abv}%) by ${checkin.brewery.brewery_name} at ${checkin.venue.venue_name} - ${timeAgo}`);
          } else {
            msg.send(`${checkin.beer.beer_name} (${checkin.beer.beer_style} - ${checkin.beer.beer_abv}%) by ${checkin.brewery.brewery_name} - ${timeAgo}`);
          }
        });
      },
      { USERNAME: username, limit: countToReturn },
    );
  };

  // Get Brewery Data
  const getBreweryData = (searchTerm, msg) => {
    if (!searchTerm) {
      msg.send('Must provide a brewery name to ask about.');
      return;
    }
    untappd.brewerySearch(
      (err, obj) => {
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        robot.logger.debug(obj.response.beers);
        if (obj.response.brewery.items.length === 0) {
          msg.send(`No breweries matched '${searchTerm}'`);
          return;
        }
        obj.response.brewery.items.slice(0, countToReturn).forEach((result) => {
          let output = `${result.brewery.brewery_id}: ${result.brewery.brewery_name}`;
          if (result.brewery.location.brewery_city !== '') {
            output += ` (${result.brewery.location.brewery_city}, ${result.brewery.location.brewery_state})`;
          }
          output += ` - ${result.brewery.beer_count} beers`;
          msg.send(output);
        });
      },
      { q: searchTerm, limit: countToReturn },
    );
  };

  const formatBeerResponse = (beerData) => {
    let beerName = beerData.beer_name;
    if (beerData.is_in_production === 0) {
      beerName = `${beerName} [Out of Production]`;
    }
    if (beerData.beer_description && (maxDescriptionLength > 0)) {
      const shortDescription = formatShortDescription(beerData.beer_description);
      return `${beerName} (${beerData.beer_style} - ${beerData.beer_abv}%) by ${beerData.brewery.brewery_name} - ${shortDescription} - https://untappd.com/beer/${beerData.bid}`;
    }
    return `${beerName} (${beerData.beer_style} - ${beerData.beer_abv}%) by ${beerData.brewery.brewery_name} - https://untappd.com/beer/${beerData.bid}`;
  };

  // Get Random Beer
  let randomAttempts = 0;
  const getRandomBeer = (msg) => {
    randomAttempts += 1;
    const beerId = Math.floor(Math.random() * maxRandomBeerId).toString();
    untappd.beerInfo(
      (err, obj) => {
        // Call itself again if attempts is less than max
        if ((obj.meta.code === 404) && (randomAttempts < 5)) {
          getRandomBeer(msg);
          return;
        }
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        msg.send(formatBeerResponse(obj.response.beer));
        randomAttempts = 0;
      },
      { BID: beerId, limit: countToReturn },
    );
  };

  // Get Beer Data
  const getBeerData = (searchTerm, msg) => {
    if (!searchTerm) {
      msg.send('Must provide a beer name to ask about.');
      return;
    }
    if (searchTerm.match(/^\d+$/)) {
      untappd.beerInfo(
        (err, obj) => {
          if (!checkUntappdErrors(err, obj, msg)) {
            return;
          }
          msg.send(formatBeerResponse(obj.response.beer));
        },
        { BID: searchTerm, limit: countToReturn },
      );
      return;
    }
    if (searchTerm.match(/^random$/i)) {
      getRandomBeer(msg);
      return;
    }
    untappd.beerSearch(
      (err, obj) => {
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        robot.logger.debug(obj.response.beers);
        if (obj.response.beers.items.length === 0) {
          msg.send(`No beers matched '${searchTerm}'`);
          return;
        }
        obj.response.beers.items.slice(0, countToReturn).forEach((result) => {
          // Search results put these at different spots
          const beerData = result.beer;
          beerData.brewery = result.brewery;
          msg.send(formatBeerResponse(beerData));
        });
      },
      { q: searchTerm, limit: countToReturn },
    );
  };

  // Show Register
  const showRegister = (msg) => {
    const url = `https://api.untappd.com/v4/user/info?client_id=${untappd.getClientId()}&client_secret=${untappd.getClientSecret()}&access_token=${untappd.getAccessToken()}`;
    msg.http(url)
      .get()((err, res, body) => {
        if (!checkHTTPErrors(err, res, body, msg)) {
          return;
        }
        robot.logger.debug(body);
        const result = JSON.parse(body);
        msg.send(`1) Add ${result.response.user.user_name} as a friend - ${result.response.user.untappd_url}\n2) Type \`${robot.name} untappd approve\``);
      });
  };

  // Show Friends
  const showFriends = (msg) => {
    const url = `https://api.untappd.com/v4/user/friends?access_token=${untappd.getAccessToken()}`;
    msg.http(url)
      .get()((err, res, body) => {
        if (!checkHTTPErrors(err, res, body, msg)) {
          return;
        }
        robot.logger.debug(body);
        const result = JSON.parse(body);
        if (result.response.items.length > 0) {
          const friends = [];
          result.response.items.forEach((friend) => {
            friends.push(`${friend.user.first_name} ${friend.user.last_name} (${friend.user.user_name})`);
          });
          msg.send(friends.join(', '));
          return;
        }
        msg.send('Your robot has no friends.');
      });
  };

  // Approve Requests
  const approveRequests = (msg) => untappd.pendingFriends(
    (error, obj) => {
      if (!checkUntappdErrors(error, obj, msg)) { return; }
      robot.logger.debug(obj);
      if (obj.response.items.length > 0) {
        obj.response.items.map((result) => untappd.acceptFriends(
          (acceptError, approveObj) => {
            if (!checkUntappdErrors(acceptError, approveObj, msg)) { return; }
            const friend = approveObj.response.target_user;
            msg.send(`Approved: ${friend.first_name} ${friend.last_name} (${friend.user_name})`);
          },
          { TARGET_ID: result.user.uid },
        ));
        return;
      }
      msg.send('No friends to approve.');
    },
    {},
  );

  // Remove Friend
  const removeFriend = (msg) => {
    // Get a list of all friends
    const username = msg.match[2].trim();
    const url = `https://api.untappd.com/v4/user/info/${username}?access_token=${untappd.getAccessToken()}`;
    msg.http(url)
      .get()((httpError, res, body) => {
        if (!checkHTTPErrors(httpError, res, body, msg)) {
          return;
        }
        const result = JSON.parse(body);
        robot.logger.debug(result);
        msg.send(`Removing ${msg.match[2].trim()} ...`);
        untappd.removeFriends(
          (error, obj) => {
            if (!checkUntappdErrors(error, obj, msg)) {
              return;
            }
            const {
              user,
            } = result.response;
            msg.send(`Removed: ${user.first_name} ${user.last_name} (${user.user_name})`);
          },
          { TARGET_ID: result.response.user.uid },
        );
      });
  };

  // Default command
  robot.respond(/untappd$/i, (msg) => {
    if (!checkConfiguration(msg)) { return; }
    getFriendFeed(msg);
  });

  // Badges
  robot.respond(/untappd badges$/i, (msg) => {
    if (!checkConfiguration(msg)) { return; }
    getBadgeFeed(msg);
  });

  // Untappd Search
  robot.respond(/untappd (user|brewery|beer) (.+)$/i, (msg) => {
    if (!checkConfiguration(msg)) { return; }

    switch (msg.match[1].trim()) {
      case 'user':
        getUserData(msg.match[2].trim(), msg);
        break;
      case 'brewery':
        getBreweryData(msg.match[2].trim(), msg);
        break;
      case 'beer':
        getBeerData(msg.match[2].trim(), msg);
        break;
      default: msg.send('Not a valid command.');
    }
  });

  // Untappd Actions
  robot.respond(/untappd (register|approve|friends|remove)(\s.*)?$/i, (msg) => {
    if (!checkConfiguration(msg)) {
      return;
    }
    switch (msg.match[1].trim()) {
      case 'register':
        showRegister(msg);
        break;
      case 'friends':
        showFriends(msg);
        break;
      case 'approve':
        approveRequests(msg);
        break;
      case 'remove':
        removeFriend(msg);
        break;
      default:
        msg.send('Not a valid command.');
    }
  });
};
