Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'
sinon = require 'sinon'

expect = chai.expect

helper = new Helper [
  '../src/untappd-friends.coffee'
]

# Alter time as test runs
originalDateNow = Date.now
mockDateNow = () ->
  return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)')

describe 'hubot-untappd-friends', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.UNTAPPD_API_KEY='foobar1'
    process.env.UNTAPPD_API_SECRET='foobar2'
    process.env.UNTAPPD_API_ACCESS_TOKEN='foobar3'
    process.env.UNTAPPD_MAX_COUNT=2
    process.env.UNTAPPD_MAX_RANDOM_ID=100
    Date.now = mockDateNow
    nock.disableNetConnect()
    @room = helper.createRoom()

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    delete process.env.UNTAPPD_API_KEY
    delete process.env.UNTAPPD_API_SECRET
    delete process.env.UNTAPPD_API_ACCESS_TOKEN
    delete process.env.UNTAPPD_MAX_COUNT
    delete process.env.UNTAPPD_MAX_RANDOM_ID
    Date.now = originalDateNow
    nock.cleanAll()
    @room.destroy()

  # hubot untappd
  it 'responds with the latest activity from your friends', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query(
        limit: 2
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/checkin-recent.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd']
          ['hubot', 'heath (heathseals) was drinking Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery at 49 Çukurcuma - an hour ago']
          ['hubot', 'heath (heathseals) was drinking Efes Pilsen (Pilsner - Other - 5%) by Anadolu Efes at DERALIYE OTTOMAN CUISINE - 8 hours ago']
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
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/checkin-recent.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd badges')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd badges']
          ['hubot', 'heath (heathseals) earned the Beer Foodie (Level 44) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago']
          ['hubot', 'heath (heathseals) earned the 99 Bottles (Level 38) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago']
          ['hubot', 'heath (heathseals) earned the Pizza & Brew (Level 4) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago']
          ['hubot', 'heath (heathseals) earned the Beer Connoisseur (Level 8) Badge after drinking a Efes Pilsen at DERALIYE OTTOMAN CUISINE - 8 hours ago']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd user
  it 'responds with the latest beers from a particular user', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/user/checkins/stephenyeargin')
      .query(
        limit: 2,
        USERNAME: 'stephenyeargin',
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/user-checkins-stephenyeargin.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd user stephenyeargin')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd user stephenyeargin']
          ['hubot', 'Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company at Yazoo Brewing Company - 12 days ago']
          ['hubot', 'Hopry (IPA - Imperial / Double - 7.9%) by Yazoo Brewing Company at Yazoo Brewing Company - 12 days ago']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd beer <query>
  it 'responds with the beer search results for a query', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/search/beer')
      .query(
        q: 'miro miel'
        limit: 2,
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/search-beer.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd beer miro miel')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd beer miro miel']
          ['hubot', '1130814: Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. - https://untappd.com/beer/1130814']
          ['hubot', '352951: Framboise Et Miel [Out of Production] (Fruit Beer - 5%) by Brouemont Micro-Brasserie & Restaurant - https://untappd.com/beer/352951']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd beer ID
  it 'responds with the information about a specific beer', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/beer/info/1130814')
      .query(
        BID: '1130814',
        access_token: 'foobar3',
        limit: 2
      )
      .replyWithFile(200, __dirname + '/fixtures/search-beer-by-id.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd beer 1130814')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd beer 1130814']
          ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey  ... - https://untappd.com/beer/1130814']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd beer ID
  it 'responds with the information about a random beer', (done) ->
    sinon.stub(Math, 'random').returns(1);
    nock('https://api.untappd.com')
      .get('/v4/beer/info/100')
      .query(
        BID: '100',
        access_token: 'foobar3',
        limit: 2
      )
      .replyWithFile(200, __dirname + '/fixtures/search-beer-by-id.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd beer random')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd beer random']
          ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey  ... - https://untappd.com/beer/1130814']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd beer <query> with numbers
  it 'responds with the beer search results for a query', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/search/beer')
      .query(
        q: 'f00f'
        limit: 2,
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/search-beer-digits.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd beer f00f')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd beer f00f']
          ['hubot', 'No beers matched \'f00f\'']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd brewery <query>
  it 'responds with brewery search results for a query', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/search/brewery')
      .query(
        q: 'east nashville beerworks'
        limit: '2',
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/search-brewery.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd brewery east nashville beerworks')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd brewery east nashville beerworks']
          ['hubot', '209759: East Nashville Beer Works (Nashville, TN) - 27 beers']
          ['hubot', '301934: East Nashville Beerworks - 4 beers']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd register
  it 'responds with instructions to register with the bot', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/user/info')
      .query(
        client_id: 'foobar1',
        client_secret: 'foobar2',
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/user-info.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd register')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd register']
          ['hubot', '1) Add websagesrobot as a friend - http://untappd.com/user/websagesrobot\n2) Type `hubot untappd approve`']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd approve
  it 'approves a pending user request', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/user/pending')
      .query(
        access_token: 'foobar3'
      )
      .replyWithFile(200, __dirname + '/fixtures/user-pending.json')
    nock('https://api.untappd.com')
      .post('/v4/friend/accept/1570195')
      .query(
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/friend-accept.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd approve')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd approve']
          ['hubot', 'Approved: Alewife NYC (AlewifeNYC)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd friends
  it 'responds with a list of the bot\'s friends', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/user/friends')
      .query(
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/user-friends.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd friends')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd friends']
          ['hubot', 'Howard C. (hchoularton), Dan D. (Tacoma_Dan), Ruben V. (Tecate213), Michael B. (Boyernator), Lennard K. (magistraalhardzuipen), Jasper R. (JasperRusthoven), Wouter R. (non_will_survive), Jacob D. (Flintquatch), B R. (Beer4Brad), Paddy  (paddyboy1918), Jimmy V  (Jvande0313), Raymond  (r4ymond), Josh R. (JoshRaynes), Roel R. (rrijks), Frankie F. (FrankieFierYo), Jim M. (jimmcm88), Sean M. (sean_themighty), Tom M. (Mostreytom), Luke P. (lukepillar), Jake W. (JakeWinstone), Maurice W. (Maurice079), Jonathan B. (jonnybgoode82), Craig B. (Arcticwolf8), Kayleigh  (_Kayleigh_), Dustin R. (droberts5)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot untappd remove <username>
  it 'removes an existing friend', (done) ->
    nock('https://api.untappd.com')
      .get('/v4/user/info/AlewifeNYC')
      .query(
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/user-info-AlewifeNYC.json')

    nock('https://api.untappd.com')
      .get('/v4/friend/remove/273954')
      .query(
        TARGET_ID: '273954',
        access_token: 'foobar3',
      )
      .replyWithFile(200, __dirname + '/fixtures/friend-remove.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot untappd remove AlewifeNYC')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot untappd remove AlewifeNYC']
          ['hubot', 'Removing AlewifeNYC ...']
          ['hubot', 'Removed: Alewife N. (AlewifeNYC)']
        ]
        done()
      catch err
        done err
      return
    , 1000)
