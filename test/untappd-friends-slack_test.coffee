Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  'adapters/slack.coffee',
  '../src/untappd-friends.coffee'
]

# Alter time as test runs
originalDateNow = Date.now
mockDateNow = () ->
  return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)')

describe 'hubot-untappd-friends for slack', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.UNTAPPD_API_KEY='foobar1'
    process.env.UNTAPPD_API_SECRET='foobar2'
    process.env.UNTAPPD_API_ACCESS_TOKEN='foobar3'
    process.env.UNTAPPD_MAX_COUNT=2
    Date.now = mockDateNow
    nock.disableNetConnect()
    @room = helper.createRoom()

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    delete process.env.UNTAPPD_API_KEY
    delete process.env.UNTAPPD_API_SECRET
    delete process.env.UNTAPPD_API_ACCESS_TOKEN
    delete process.env.UNTAPPD_MAX_COUNT
    Date.now = originalDateNow
    nock.cleanAll()
    @room.destroy()

  # hubot untappd
  it 'responds with the latest activity from your friends', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query(
        limit: 2,
        client_id: 'foobar1',
        client_secret: 'foobar2',
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/checkin-recent.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "an hour ago at 49 Çukurcuma",
                  "color": "#7CD197",
                  "fallback": "heath (heathseals) was drinking a Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery at 49 Çukurcuma - an hour ago",
                  "footer": "Earned the Beer Foodie (Level 44) badge and 2 more",
                  "footer_icon": "https://untappd.akamaized.net/badges/bdg_BeerFoodie_sm.jpg",
                  "thumb_url": "https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg",
                  "title": "heath (heathseals) was drinking a Blonde Ale by Gara Guzu Brewery",
                  "title_link": "https://untappd.com/user/heathseals/checkin/578981788"
                },
                {
                  "author_name": "8 hours ago at DERALIYE OTTOMAN CUISINE",
                  "color": "#7CD197",
                  "fallback": "heath (heathseals) was drinking a Efes Pilsen (Pilsner - Other - 5%) by Anadolu Efes at DERALIYE OTTOMAN CUISINE - 8 hours ago",
                  "footer": "Earned the Beer Connoisseur (Level 8) badge",
                  "footer_icon": "https://untappd.akamaized.net/badges/bdg_connoiseur_sm.jpg",
                  "thumb_url": "https://untappd.akamaized.net/site/beer_logos/beer-EfesPilsener_17259.jpeg",
                  "title": "heath (heathseals) was drinking a Efes Pilsen by Anadolu Efes",
                  "title_link": "https://untappd.com/user/heathseals/checkin/578869664"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd badges
  it 'responds with the latest badge activity from your friends', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query(
        limit: 2,
        client_id: 'foobar1',
        client_secret: 'foobar2',
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/checkin-recent.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd badges')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd badges']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "an hour ago at 49 Çukurcuma",
                  "color": "#7CD197",
                  "fallback": "heath (heathseals) earned the Beer Foodie (Level 44) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago",
                  "footer": "Blonde Ale",
                  "footer_icon": "https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg",
                  "thumb_url": "https://untappd.akamaized.net/badges/bdg_BeerFoodie_sm.jpg",
                  "title": "heath (heathseals) earned the Beer Foodie (Level 44) Badge",
                  "title_link": "https://untappd.com/user/heathseals/checkin/578981788"
                },
                {
                  "author_name": "an hour ago at 49 Çukurcuma",
                  "color": "#7CD197",
                  "fallback": "heath (heathseals) earned the 99 Bottles (Level 38) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago",
                  "footer": "Blonde Ale",
                  "footer_icon": "https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg",
                  "thumb_url": "https://untappd.akamaized.net/badges/bdg_99Bottles_sm.jpg",
                  "title": "heath (heathseals) earned the 99 Bottles (Level 38) Badge",
                  "title_link": "https://untappd.com/user/heathseals/checkin/578981788"
                },
                {
                  "author_name": "an hour ago at 49 Çukurcuma",
                  "color": "#7CD197",
                  "fallback": "heath (heathseals) earned the Pizza & Brew (Level 4) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago",
                  "footer": "Blonde Ale",
                  "footer_icon": "https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg",
                  "thumb_url": "https://untappd.akamaized.net/badges/bdg_PizzaAndBrew_sm.jpg",
                  "title": "heath (heathseals) earned the Pizza & Brew (Level 4) Badge",
                  "title_link": "https://untappd.com/user/heathseals/checkin/578981788"
                },
                {
                  "author_name": "8 hours ago at DERALIYE OTTOMAN CUISINE",
                  "color": "#7CD197",
                  "fallback": "heath (heathseals) earned the Beer Connoisseur (Level 8) Badge after drinking a Efes Pilsen at DERALIYE OTTOMAN CUISINE - 8 hours ago",
                  "footer": "Efes Pilsen",
                  "footer_icon": "https://untappd.akamaized.net/site/beer_logos/beer-EfesPilsener_17259.jpeg",
                  "thumb_url": "https://untappd.akamaized.net/badges/bdg_connoiseur_sm.jpg",
                  "title": "heath (heathseals) earned the Beer Connoisseur (Level 8) Badge",
                  "title_link": "https://untappd.com/user/heathseals/checkin/578869664"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)
