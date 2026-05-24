const {
  describe, it, beforeEach, afterEach,
} = require('node:test');
const assert = require('node:assert/strict');
const nock = require('nock');
const { createTestBot } = require('./common/TestBot');

// Alter time as test runs
const originalDateNow = Date.now;
const mockDateNow = () => Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)');

describe('hubot-untappd-friends', () => {
  let bot;

  beforeEach(async () => {
    Date.now = mockDateNow;
    bot = await createTestBot();
  });

  afterEach(() => {
    Date.now = originalDateNow;
    bot.shutdown();
  });

  it('responds with the latest activity from your friends', async () => {
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query({ limit: '2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/checkin-recent.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd');
    assert.equal(response, 'heath (heathseals) was drinking Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery at 49 Çukurcuma - an hour ago');
  });

  it('sends a toast for all latest activity of your friends', async () => {
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query({ limit: '2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/checkin-recent.json`);
    nock('https://api.untappd.com')
      .post('/v4/checkin/toast/578981788')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/toast.json`);
    nock('https://api.untappd.com')
      .post('/v4/checkin/toast/578869664')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/toast.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd toast');
    assert.equal(response, "🍻 Toasted heath (heathseals)'s Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery - https://untappd.com/user/heathseals/checkin/578981788");
  });

  it('sends a toast for a particular user recent checkin', async () => {
    nock('https://api.untappd.com')
      .get('/v4/user/checkins/stephenyeargin')
      .query({ limit: 1, USERNAME: 'stephenyeargin', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-checkins-stephenyeargin-limit-1.json`);
    nock('https://api.untappd.com')
      .post('/v4/checkin/toast/574773374')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/toast.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd toast stephenyeargin');
    assert.equal(response, "🍻 Toasted Stephen (stephenyeargin)'s Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company - https://untappd.com/user/stephenyeargin/checkin/574773374");
  });

  it('responds with the latest badge activity from your friends', async () => {
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query({ limit: '2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/checkin-recent.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd badges');
    assert.equal(response, 'heath (heathseals) earned the Beer Foodie (Level 44) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago - https://untappd.com/user/heathseals/checkin/578981788');
  });

  it('responds with the latest beers from a particular user', async () => {
    nock('https://api.untappd.com')
      .get('/v4/user/info/stephenyeargin')
      .query({ USERNAME: 'stephenyeargin', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-info.json`);
    nock('https://api.untappd.com')
      .get('/v4/user/checkins/stephenyeargin')
      .query({ limit: '2', USERNAME: 'stephenyeargin', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-checkins-stephenyeargin.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd user stephenyeargin');
    assert.equal(response, 'Stephen (stephenyeargin): 699 beers, 1056 checkins, 659 badges\n- Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company at Yazoo Brewing Company - 12 days ago\n- Hopry (IPA - Imperial / Double - 7.9%) by Yazoo Brewing Company at Yazoo Brewing Company - 12 days ago');
  });

  it('responds with the beer search results for a query', async () => {
    nock('https://api.untappd.com')
      .get('/v4/search/beer')
      .query({ q: 'miro miel', limit: '2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd beer miro miel');
    assert.equal(response, 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ... - https://untappd.com/beer/1130814');
  });

  it('responds with the information about a specific beer', async () => {
    nock('https://api.untappd.com')
      .get('/v4/beer/info/1130814')
      .query({ BID: '1130814', access_token: 'foobar3', limit: '2' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd beer 1130814');
    assert.equal(response, 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ... - https://untappd.com/beer/1130814');
  });

  it('responds with the information about a random beer', async () => {
    const origRandom = Math.random;
    Math.random = () => 1;
    nock('https://api.untappd.com')
      .get('/v4/beer/info/100')
      .query({ BID: '100', access_token: 'foobar3', limit: '2' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd beer random');
    Math.random = origRandom;
    assert.equal(response, 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ... - https://untappd.com/beer/1130814');
  });

  it('responds with the information about a random beer after a 404', async () => {
    let callCount = 0;
    const origRandom = Math.random;
    Math.random = () => {
      callCount += 1;
      return callCount === 1 ? 0.5 : 1;
    };
    nock('https://api.untappd.com')
      .get('/v4/beer/info/50')
      .query({ BID: '50', access_token: 'foobar3', limit: '2' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id-404.json`);
    nock('https://api.untappd.com')
      .get('/v4/beer/info/100')
      .query({ BID: '100', access_token: 'foobar3', limit: '2' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd beer random');
    Math.random = origRandom;
    assert.equal(response, 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ... - https://untappd.com/beer/1130814');
  });

  it('responds with the beer info for an ID (no results)', async () => {
    nock('https://api.untappd.com')
      .get('/v4/search/beer')
      .query({ q: 'f00f', limit: '2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-digits.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd beer f00f');
    assert.equal(response, "No beers matched 'f00f'");
  });

  it('responds with brewery search results for a query', async () => {
    nock('https://api.untappd.com')
      .get('/v4/search/brewery')
      .query({ q: 'east nashville beerworks', limit: '2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/search-brewery.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd brewery east nashville beerworks');
    assert.equal(response, 'East Nashville Beer Works (Nashville, TN) - 27 beers - https://untappd.com/brewery/209759');
  });

  it('responds with the brewery info for an ID', async () => {
    nock('https://api.untappd.com')
      .get('/v4/brewery/info/301934')
      .query({ BREWERY_ID: '301934', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/search-brewery-by-id.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd brewery 301934');
    assert.equal(response, 'East Nashville Beer Works (Nashville, TN) - 24 beers - https://untappd.com/brewery/209759');
  });

  it('responds with instructions to register with the bot', async () => {
    nock('https://api.untappd.com')
      .get('/v4/user/info')
      .query({ client_id: 'foobar1', client_secret: 'foobar2', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-info-bot.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd register');
    assert.equal(response, '1) Add websagesrobot as a friend - http://untappd.com/user/websagesrobot\n2) Type `hubot untappd approve`');
  });

  it('approves a pending user request', async () => {
    nock('https://api.untappd.com')
      .get('/v4/user/pending')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-pending.json`);
    nock('https://api.untappd.com')
      .post('/v4/friend/accept/1570195')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/friend-accept.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd approve');
    assert.equal(response, 'Approved: Alewife NYC (AlewifeNYC)');
  });

  it("responds with a list of the bot's friends", async () => {
    nock('https://api.untappd.com')
      .get('/v4/user/friends')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-friends.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd friends');
    assert.equal(response, 'Howard (hchoularton), Dan (Tacoma_Dan), Ruben (Tecate213), Michael (Boyernator), Lennard (magistraalhardzuipen), Jasper (JasperRusthoven), Wouter (non_will_survive), Jacob (Flintquatch), B (Beer4Brad), Paddy (paddyboy1918), Jimmy V (Jvande0313), Raymond (r4ymond), Josh (JoshRaynes), Roel (rrijks), Frankie (FrankieFierYo), Jim (jimmcm88), Sean (sean_themighty), Tom (Mostreytom), Luke (lukepillar), Jake (JakeWinstone), Maurice (Maurice079), Jonathan (jonnybgoode82), Craig (Arcticwolf8), Kayleigh (_Kayleigh_), Dustin (droberts5)');
  });

  it('removes an existing friend', async () => {
    nock('https://api.untappd.com')
      .get('/v4/user/info/AlewifeNYC')
      .query({ access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/user-info-AlewifeNYC.json`);
    nock('https://api.untappd.com')
      .get('/v4/friend/remove/273954')
      .query({ TARGET_ID: '273954', access_token: 'foobar3' })
      .replyWithFile(200, `${__dirname}/fixtures/friend-remove.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd remove AlewifeNYC');
    assert.equal(response, 'Removing AlewifeNYC ...');
  });
});

describe('hide beer descriptions', () => {
  let bot;

  beforeEach(async () => {
    Date.now = mockDateNow;
    bot = await createTestBot({ UNTAPPD_MAX_COUNT: null, UNTAPPD_MAX_DESCRIPTION_LENGTH: '0' });
  });

  afterEach(() => {
    Date.now = originalDateNow;
    bot.shutdown();
  });

  it('hides beer description', async () => {
    nock('https://api.untappd.com')
      .get('/v4/beer/info/1130814')
      .query({ BID: '1130814', access_token: 'foobar3', limit: '5' })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const response = await bot.sendAndWaitForResponse('@hubot untappd beer 1130814');
    assert.equal(response, 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - https://untappd.com/beer/1130814');
  });
});
