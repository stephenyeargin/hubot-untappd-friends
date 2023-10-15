/* globals describe, it, beforeEach, afterEach */

const Helper = require('hubot-test-helper');
const chai = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const {
  expect,
} = chai;

const helper = new Helper([
  '../src/untappd-friends.js',
]);

// Alter time as test runs
const originalDateNow = Date.now;
const mockDateNow = () => Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)');
let randomStub;

describe('hubot-untappd-friends', () => {
  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    process.env.UNTAPPD_API_KEY = 'foobar1';
    process.env.UNTAPPD_API_SECRET = 'foobar2';
    process.env.UNTAPPD_API_ACCESS_TOKEN = 'foobar3';
    process.env.UNTAPPD_MAX_COUNT = 2;
    process.env.UNTAPPD_MAX_RANDOM_ID = 100;
    Date.now = mockDateNow;
    nock.disableNetConnect();
    this.room = helper.createRoom();
    randomStub = sinon.stub(Math, 'random');
  });

  afterEach(() => {
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.UNTAPPD_API_KEY;
    delete process.env.UNTAPPD_API_SECRET;
    delete process.env.UNTAPPD_API_ACCESS_TOKEN;
    delete process.env.UNTAPPD_MAX_COUNT;
    delete process.env.UNTAPPD_MAX_RANDOM_ID;
    Date.now = originalDateNow;
    nock.cleanAll();
    this.room.destroy();
    randomStub.restore();
  });

  // hubot untappd
  it('responds with the latest activity from your friends', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query({
        limit: 2,
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/checkin-recent.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd'],
            ['hubot', 'heath (heathseals) was drinking Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery at 49 Çukurcuma - an hour ago'],
            ['hubot', 'heath (heathseals) was drinking Efes Pilsen (Pilsner - Other - 5%) by Anadolu Efes at DERALIYE OTTOMAN CUISINE - 8 hours ago'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd badges
  it('responds with the latest badge activity from your friends', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query({
        limit: 2,
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/checkin-recent.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd badges');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd badges'],
            ['hubot', 'heath (heathseals) earned the Beer Foodie (Level 44) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago'],
            ['hubot', 'heath (heathseals) earned the 99 Bottles (Level 38) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago'],
            ['hubot', 'heath (heathseals) earned the Pizza & Brew (Level 4) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago'],
            ['hubot', 'heath (heathseals) earned the Beer Connoisseur (Level 8) Badge after drinking a Efes Pilsen at DERALIYE OTTOMAN CUISINE - 8 hours ago'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd user
  it('responds with the latest beers from a particular user', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/user/info/stephenyeargin')
      .query({
        USERNAME: 'stephenyeargin',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-info.json`);
    nock('https://api.untappd.com')
      .get('/v4/user/checkins/stephenyeargin')
      .query({
        limit: 2,
        USERNAME: 'stephenyeargin',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-checkins-stephenyeargin.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd user stephenyeargin');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd user stephenyeargin'],
            ['hubot', 'Stephen Y (stephenyeargin): 699 beers, 1056 checkins, 659 badges\n- Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company at Yazoo Brewing Company - 12 days ago\n- Hopry (IPA - Imperial / Double - 7.9%) by Yazoo Brewing Company at Yazoo Brewing Company - 12 days ago'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd beer <query>
  it('responds with the beer search results for a query', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/search/beer')
      .query({
        q: 'miro miel',
        limit: 2,
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd beer miro miel');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd beer miro miel'],
            ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. - https://untappd.com/beer/1130814'],
            ['hubot', 'Framboise Et Miel [Out of Production] (Fruit Beer - 5%) by Brouemont Micro-Brasserie & Restaurant - https://untappd.com/beer/352951'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd beer ID
  it('responds with the information about a specific beer', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/beer/info/1130814')
      .query({
        BID: '1130814',
        access_token: 'foobar3',
        limit: 2,
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd beer 1130814');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd beer 1130814'],
            ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey  ... - https://untappd.com/beer/1130814'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd beer ID
  it('responds with the information about a random beer', (done) => {
    randomStub.onFirstCall().returns(1);
    nock('https://api.untappd.com')
      .get('/v4/beer/info/100')
      .query({
        BID: '100',
        access_token: 'foobar3',
        limit: 2,
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd beer random');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd beer random'],
            ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey  ... - https://untappd.com/beer/1130814'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with the information about a random beer after a 404', (done) => {
    randomStub.onFirstCall().returns(0.5);
    randomStub.onSecondCall().returns(1);
    nock('https://api.untappd.com')
      .get('/v4/beer/info/50')
      .query({
        BID: '50',
        access_token: 'foobar3',
        limit: 2,
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id-404.json`);
    nock('https://api.untappd.com')
      .get('/v4/beer/info/100')
      .query({
        BID: '100',
        access_token: 'foobar3',
        limit: 2,
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd beer random');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd beer random'],
            ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey  ... - https://untappd.com/beer/1130814'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd beer <query> with numbers
  it('responds with the beer search results for a query', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/search/beer')
      .query({
        q: 'f00f',
        limit: 2,
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-digits.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd beer f00f');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd beer f00f'],
            ['hubot', 'No beers matched \'f00f\''],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd brewery <query>
  it('responds with brewery search results for a query', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/search/brewery')
      .query({
        q: 'east nashville beerworks',
        limit: '2',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-brewery.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd brewery east nashville beerworks');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd brewery east nashville beerworks'],
            ['hubot', '209759: East Nashville Beer Works (Nashville, TN) - 27 beers'],
            ['hubot', '301934: East Nashville Beerworks - 4 beers'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd register
  it('responds with instructions to register with the bot', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/user/info')
      .query({
        client_id: 'foobar1',
        client_secret: 'foobar2',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-info-bot.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd register');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd register'],
            ['hubot', '1) Add websagesrobot as a friend - http://untappd.com/user/websagesrobot\n2) Type `hubot untappd approve`'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd approve
  it('approves a pending user request', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/user/pending')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-pending.json`);
    nock('https://api.untappd.com')
      .post('/v4/friend/accept/1570195')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/friend-accept.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd approve');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd approve'],
            ['hubot', 'Approved: Alewife NYC (AlewifeNYC)'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd friends
  it('responds with a list of the bot\'s friends', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/user/friends')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-friends.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd friends');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd friends'],
            ['hubot', 'Howard C. (hchoularton), Dan D. (Tacoma_Dan), Ruben V. (Tecate213), Michael B. (Boyernator), Lennard K. (magistraalhardzuipen), Jasper R. (JasperRusthoven), Wouter R. (non_will_survive), Jacob D. (Flintquatch), B R. (Beer4Brad), Paddy  (paddyboy1918), Jimmy V  (Jvande0313), Raymond  (r4ymond), Josh R. (JoshRaynes), Roel R. (rrijks), Frankie F. (FrankieFierYo), Jim M. (jimmcm88), Sean M. (sean_themighty), Tom M. (Mostreytom), Luke P. (lukepillar), Jake W. (JakeWinstone), Maurice W. (Maurice079), Jonathan B. (jonnybgoode82), Craig B. (Arcticwolf8), Kayleigh  (_Kayleigh_), Dustin R. (droberts5)'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd remove <username>
  it('removes an existing friend', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/user/info/AlewifeNYC')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-info-AlewifeNYC.json`);

    nock('https://api.untappd.com')
      .get('/v4/friend/remove/273954')
      .query({
        TARGET_ID: '273954',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/friend-remove.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd remove AlewifeNYC');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd remove AlewifeNYC'],
            ['hubot', 'Removing AlewifeNYC ...'],
            ['hubot', 'Removed: Alewife N. (AlewifeNYC)'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });
});

describe('hide beer descriptions', () => {
  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    process.env.UNTAPPD_API_KEY = 'foobar1';
    process.env.UNTAPPD_API_SECRET = 'foobar2';
    process.env.UNTAPPD_API_ACCESS_TOKEN = 'foobar3';
    process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH = 0;
    Date.now = mockDateNow;
    nock.disableNetConnect();
    this.room = helper.createRoom();
  });

  afterEach(() => {
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.UNTAPPD_API_KEY;
    delete process.env.UNTAPPD_API_SECRET;
    delete process.env.UNTAPPD_API_ACCESS_TOKEN;
    delete process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH;
    Date.now = originalDateNow;
    nock.cleanAll();
    this.room.destroy();
  });

  // hubot untappd
  it('hides beer description', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/beer/info/1130814')
      .query({
        BID: '1130814',
        access_token: 'foobar3',
        limit: 5,
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-beer-by-id.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd beer 1130814');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd beer 1130814'],
            ['hubot', 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - https://untappd.com/beer/1130814'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });
});
