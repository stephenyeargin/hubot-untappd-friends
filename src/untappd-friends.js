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
//  hubot untappd toast - Have the bot toast the most recent checkin from each user in activity feed
//  hubot untappd toast <username> - Have the bot toast user's most recent checkin
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
  const countToReturn = process.env.UNTAPPD_MAX_COUNT || 5;
  const maxRandomBeerId = process.env.UNTAPPD_MAX_RANDOM_ID || 5600000;
  let maxDescriptionLength = process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH;

  const untappd = new UntappdClient(/debug/i.test(process.env.HUBOT_LOG_LEVEL));
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
      msg.send(JSON.stringify(err));
      return false;
    }
    if (obj.meta?.error_detail) {
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

  // Format beer description
  const formatBeerDescription = (beerData) => {
    if (!beerData.beer_description) {
      return '';
    }
    if (typeof maxDescriptionLength === 'undefined') {
      maxDescriptionLength = 150;
    }
    if (maxDescriptionLength === '0') {
      return '';
    }
    maxDescriptionLength = parseInt(maxDescriptionLength, 10);
    const shortDescription = beerData.beer_description.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
    return shortDescription.substr(0, maxDescriptionLength - 1).trim() + ((shortDescription.length > maxDescriptionLength ? ' ...' : ''));
  };

  // Format beer name
  const formatBeerName = (beerData, slackTitle = false) => {
    let beerName = beerData.beer_name.trim();
    if (beerData.is_in_production === 0) {
      beerName = `${beerName} [Out of Production]`;
    }
    if (slackTitle) {
      return `${beerName} (${beerData.beer_style})`;
    }
    if (beerData.beer_abv > 0) {
      return `${beerName} (${beerData.beer_style} - ${beerData.beer_abv}%) by ${beerData.brewery.brewery_name?.trim()}`;
    }
    return `${beerName} (${beerData.beer_style}) by ${beerData.brewery.brewery_name?.trim()}`;
  };

  // Format checkin
  const formatCheckin = (checkin) => {
    if (/slack/i.test(robot.adapterName)) {
      const output = {
        title: formatBeerName({ ...checkin.beer, brewery: checkin.brewery }),
        fallback: formatBeerName({ ...checkin.beer, brewery: checkin.brewery }),
        thumb_url: checkin.beer.beer_label,
        title_link: `https://untappd.com/user/${checkin.user.user_name}/checkin/${checkin.checkin_id}`,
        ts: moment(new Date(checkin.created_at)).unix(),
        color: '#7CD197',
      };
      if (checkin.venue.venue_name) {
        output.footer = checkin.venue.venue_name ? `at ${checkin.venue.venue_name}` : '';
        output.footer_icon = checkin.venue.venue_icon.lg;
      }
      return output;
    }
    const timeAgo = moment(new Date(checkin.created_at)).fromNow();
    if (checkin.venue.venue_name) {
      return `- ${formatBeerName({ ...checkin.beer, brewery: checkin.brewery })} at ${checkin.venue.venue_name} - ${timeAgo}`;
    }
    return `- ${formatBeerName({ ...checkin.beer, brewery: checkin.brewery })} - ${timeAgo}`;
  };

  // Format display name
  const formatDisplayName = (user) => `${user.first_name} (${user.user_name})`;

  // Format user
  const formatUser = (user) => {
    if (/slack/i.test(robot.adapterName)) {
      return {
        title: formatDisplayName(user),
        fallback: `${formatDisplayName(user)}: ${user.stats.total_beers} beers, ${user.stats.total_checkins} checkins, ${user.stats.total_badges} badges`,
        thumb_url: user.user_avatar,
        title_link: `https://untappd.com/user/${user.user_name}`,
        color: '#7CD197',
        fields: [
          { title: 'Joined', value: moment(user.created_at).format('MMM DD, YYYY'), short: true },
          { title: 'Beers', value: user.stats.total_beers, short: true },
          { title: 'Checkins', value: user.stats.total_checkins, short: true },
          { title: 'Badges', value: user.stats.total_badges, short: true },
        ],
      };
    }
    return `${formatDisplayName(user)}: ${user.stats.total_beers} beers, ${user.stats.total_checkins} checkins, ${user.stats.total_badges} badges`;
  };

  // Format beer link
  const formatBeerLink = (beer) => `https://untappd.com/beer/${beer.bid}`;

  // Format checkin link
  const formatCheckinLink = (checkin) => `https://untappd.com/user/${checkin.user.user_name}/checkin/${checkin.checkin_id}`;

  // Format beer response
  const formatBeer = (beerData) => {
    if (/slack/i.test(robot.adapterName)) {
      const beerFields = [];
      if (beerData.rating_score) {
        beerFields.push({
          title: 'Rating',
          value: `${beerData.rating_score.toFixed(2)} (${beerData.rating_count.toLocaleString()} ratings)`,
          short: true,
        });
      }
      if (beerData.beer_abv) {
        beerFields.push({ title: 'ABV', value: `${beerData.beer_abv}%`, short: true });
      }
      if (beerData.beer_ibu) {
        beerFields.push({ title: 'IBU', value: beerData.beer_ibu, short: true });
      }
      return {
        attachments: [
          {
            fallback: formatBeerDescription(beerData) !== ''
              ? `${formatBeerName(beerData)} - ${formatBeerDescription(beerData)}`
              : formatBeerName(beerData),
            title: formatBeerName(beerData, true),
            title_link: `${formatBeerLink(beerData)}`,
            text: formatBeerDescription(beerData),
            thumb_url: beerData.beer_label,
            fields: beerFields,
            color: '#7CD197',
            mrkdwn_in: ['text'],
            author_icon: beerData.brewery.brewery_label,
            author_link: beerData.brewery.contact?.url,
            author_name: beerData.brewery.location?.brewery_city
              ? `${beerData.brewery.brewery_name} (${beerData.brewery.location?.brewery_city}, ${beerData.brewery.location?.brewery_state})`
              : beerData.brewery.brewery_name,
          },
        ],
        unfurl_links: false,
      };
    }
    if (formatBeerDescription(beerData) !== '') {
      return `${formatBeerName(beerData)} - ${formatBeerDescription(beerData)} - ${formatBeerLink(beerData)}`;
    }
    return `${formatBeerName(beerData)} - ${formatBeerLink(beerData)}`;
  };

  // Format beer response
  const formatBrewery = (breweryData) => {
    const fallback = breweryData.location?.brewery_city
      ? `${breweryData.brewery_name} (${breweryData.location?.brewery_city}, ${breweryData.location?.brewery_state}) - ${breweryData.beer_count} beers - https://untappd.com/brewery/${breweryData.brewery_id}`
      : `${breweryData.brewery_name} - ${breweryData.beer_count} beers - https://untappd.com/brewery/${breweryData.brewery_id}`;
    if (/slack/i.test(robot.adapterName)) {
      const breweryFields = [];
      if (breweryData.location?.brewery_city) {
        breweryFields.push({ title: 'Location', value: `${breweryData.location.brewery_city}, ${breweryData.location.brewery_state}`, short: true });
      }
      if (breweryData.brewery_type) {
        breweryFields.push({ title: 'Brewery Type', value: breweryData.brewery_type, short: true });
      }
      if (breweryData.beer_count) {
        breweryFields.push({ title: 'Beers', value: `${breweryData.beer_count.toLocaleString()}`, short: true });
      }
      if (breweryData.rating?.rating_score) {
        breweryFields.push({
          title: 'Rating',
          value: `${breweryData.rating.rating_score.toFixed(2)} (${breweryData.rating.count.toLocaleString()} ratings)`,
          short: true,
        });
      }
      return {
        attachments: [
          {
            fallback,
            title: breweryData.brewery_name,
            title_link: `https://untappd.com/brewery/${breweryData.brewery_id}`,
            text: breweryData.brewery_description || null,
            thumb_url: breweryData.brewery_label,
            fields: breweryFields,
            color: '#7CD197',
            mrkdwn_in: ['text'],
          },
        ],
        unfurl_links: false,
      };
    }
    return fallback;
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
        const timeAgo = moment(new Date(checkin.created_at)).fromNow();
        const displayName = formatDisplayName(checkin.user);
        chunk = {
          title: `${displayName} was drinking ${checkin.beer.beer_name} by ${checkin.brewery.brewery_name}`,
          title_link: `https://untappd.com/user/${checkin.user.user_name}/checkin/${checkin.checkin_id}`,
          thumb_url: `${checkin.beer.beer_label}`,
          color: '#7CD197',
          ts: moment(new Date(checkin.created_at)).unix(),
        };
        if (checkin.venue.venue_name) {
          chunk.footer = `${checkin.venue.venue_name}`;
          chunk.fallback = `${displayName} was drinking ${formatBeerName({ ...checkin.beer, brewery: checkin.brewery })} at ${checkin.venue.venue_name} - ${timeAgo}`;
        } else {
          chunk.fallback = `${displayName} was drinking ${formatBeerName({ ...checkin.beer, brewery: checkin.brewery })} - ${timeAgo}`;
        }

        if (checkin.badges.count === 1) {
          [firstBadge] = checkin.badges.items;
          chunk.footer = [chunk.footer, `Earned the ${firstBadge.badge_name} badge`].join(' • ');
          chunk.footer_icon = `${firstBadge.badge_image.sm}`;
        }
        if (checkin.badges.count > 1) {
          [firstBadge] = checkin.badges.items;
          const otherBadges = checkin.badges.count - 1;
          chunk.footer = [chunk.footer, `Earned the ${firstBadge.badge_name} badge and ${otherBadges} more`].join(' • ');
          chunk.footer_icon = `${firstBadge.badge_image.sm}`;
        }
        contents.push(chunk);
      });

      // Congratulate the users that "run the board"
      if (countToReturn > 1) {
        const uniqueUsers = [];
        const uniqueLocations = [];
        obj.response.checkins.items.forEach((checkin) => {
          if (!uniqueUsers.includes(formatDisplayName(checkin.user))) {
            uniqueUsers.push(formatDisplayName(checkin.user));
          }
          if (!uniqueLocations.includes(checkin.venue.venue_name)) {
            uniqueLocations.push(checkin.venue.venue_name);
          }
        });
        if (uniqueLocations.length === 1 && uniqueLocations[0]) {
          contents.push({
            text: `🏆 Congratulations to ${uniqueUsers.join(' + ')} for running the board at ${uniqueLocations[0]}! 🍻`,
            fallback: `🏆 Congratulations to ${uniqueUsers.join(' + ')} for running the board at ${uniqueLocations[0]}! 🍻`,
          });
        } else if (uniqueUsers.length === 1) {
          contents.push({
            text: `🏆 Congratulations to ${uniqueUsers[0]} for running the board! 🍻`,
            fallback: `🏆 Congratulations to ${uniqueUsers[0]} for running the board! 🍻`,
          });
        }
      }

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

  // Toast recent checkins
  const toastRecentCheckins = (msg) => {
    const username = msg.match[1].trim();
    const users = {};
    if (username) {
      untappd.userActivityFeed(
        (err, obj) => {
          if (!checkUntappdErrors(err, obj, msg)) {
            return;
          }
          obj.response.checkins.items.forEach((checkin) => {
            if (users[checkin.user.uid] || checkin.toasts.auth_toast) {
              robot.logger.info(`Already toasted recent checkin for ${formatDisplayName(checkin.user)}`);
              return;
            }
            users[checkin.user.uid] = true;
            untappd.toast(
              (err2, obj2) => {
                if (!checkUntappdErrors(err2, obj2, msg)) {
                  return;
                }
                if (obj2.result !== 'success') {
                  robot.logger.error('Failed to toast checkin.');
                  robot.logger.debug(obj2);
                }
                msg.send(`🍻 Toasted ${formatDisplayName(checkin.user)}'s ${formatBeerName({ ...checkin.beer, brewery: checkin.brewery })} - ${formatCheckinLink(checkin)}`);
              },
              { CHECKIN_ID: checkin.checkin_id },
            );
          });
        },
        { USERNAME: username, limit: 1 },
      );
      return;
    }

    untappd.activityFeed(
      (err, obj) => {
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        obj.response.checkins.items.forEach((checkin) => {
          if (checkin.toasts.auth_toast || users[checkin.user.uid]) {
            robot.logger.info(`Already toasted recent checkin for ${formatDisplayName(checkin.user)})`);
            return;
          }
          users[checkin.user.uid] = true;
          untappd.toast(
            (err2, obj2) => {
              if (!checkUntappdErrors(err2, obj2, msg)) {
                return;
              }
              if (obj2.result !== 'success') {
                robot.logger.error('Failed to toast checkin.');
                robot.logger.debug(obj2);
              }
              msg.send(`🍻 Toasted ${formatDisplayName(checkin.user)}'s ${formatBeerName({ ...checkin.beer, brewery: checkin.brewery })} - ${formatCheckinLink(checkin)}`);
            },
            { CHECKIN_ID: checkin.checkin_id },
          );
        });
      },
      { limit: countToReturn },
    );
  };

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
            title: `${formatDisplayName(checkin.user)} earned the ${badge.badge_name} Badge`,
            title_link: `https://untappd.com/user/${checkin.user.user_name}/checkin/${checkin.checkin_id}`,
            thumb_url: `${badge.badge_image.sm}`,
            footer: `${checkin.beer.beer_name}`,
            footer_icon: `${checkin.beer.beer_label}`,
            color: '#7CD197',
          };
          if (checkin.venue.venue_name) {
            chunk.author_name = `${timeAgo} at ${checkin.venue.venue_name}`;
            chunk.fallback = `${formatDisplayName(checkin.user)} earned the ${badge.badge_name} Badge after drinking a ${checkin.beer.beer_name} at ${checkin.venue.venue_name} - ${timeAgo} - ${formatCheckinLink(checkin)}`;
          } else {
            chunk.author_name = `${timeAgo}`;
            chunk.fallback = `${formatDisplayName(checkin.user)} earned the ${badge.badge_name} Badge after drinking a ${checkin.beer.beer_name} - ${timeAgo} - ${formatCheckinLink(checkin)}`;
          }

          contents.push(chunk);
        });
      });

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

  // Get User Data
  const getUserData = (username, msg) => {
    if (!username) {
      msg.send('Must provide a username to ask about.');
      return;
    }
    const output = [];
    untappd.userInfo(
      (err, obj) => {
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        robot.logger.debug(obj.response.user);
        output.push(formatUser(obj.response.user));
        untappd.userActivityFeed(
          (err1, obj1) => {
            if (!checkUntappdErrors(err1, obj1, msg)) {
              return;
            }
            robot.logger.debug(obj1.response.checkins);
            if (err1) {
              msg.send(`Could not retrieve recent checkins for ${username}.`);
              return;
            }
            obj1.response.checkins.items.forEach((checkin) => {
              output.push(formatCheckin(checkin));
            });
            // Slack formatting
            if (/slack/i.test(robot.adapterName)) {
              robot.messageRoom(msg.message.room, { attachments: output, unfurl_links: false });
              return;
            }
            msg.send(output.join('\n'));
          },
          { USERNAME: username, limit: countToReturn },
        );
      },
      { USERNAME: username },
    );
  };

  // Get Brewery Data
  const getBreweryData = (searchTerm, msg) => {
    if (!searchTerm) {
      msg.send('Must provide a brewery name to ask about.');
      return;
    }
    if (/\d+/.test(searchTerm)) {
      untappd.breweryInfo(
        (err, obj) => {
          if (!checkUntappdErrors(err, obj, msg)) {
            return;
          }
          msg.send(formatBrewery(obj.response.brewery));
        },
        {
          BREWERY_ID: searchTerm,
        },
      );
      return;
    }
    untappd.brewerySearch(
      (err, obj) => {
        if (!checkUntappdErrors(err, obj, msg)) {
          return;
        }
        robot.logger.debug(obj.response.brewery);
        if (obj.response.brewery.items.length === 0) {
          msg.send(`No breweries matched '${searchTerm}'`);
          return;
        }
        obj.response.brewery.items.slice(0, countToReturn).forEach((result) => {
          msg.send(formatBrewery(result.brewery));
        });
      },
      { q: searchTerm, limit: countToReturn },
    );
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
        msg.send(formatBeer(obj.response.beer));
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
          msg.send(formatBeer(obj.response.beer));
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
          msg.send(formatBeer(beerData));
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
            friends.push(formatDisplayName(friend.user));
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
        obj.response.items.forEach((result) => untappd.acceptFriends(
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

  // Toast checkins
  robot.respond(/untappd (?:toast|toast|prost|salud|cheers|santé)\s?(.*)$/i, (msg) => {
    if (!checkConfiguration(msg)) { return; }
    toastRecentCheckins(msg);
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
