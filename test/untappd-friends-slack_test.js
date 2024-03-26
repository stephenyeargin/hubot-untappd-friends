/* globals describe, it, beforeEach, afterEach */

const Helper = require('hubot-test-helper');
const chai = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const {
  expect,
} = chai;

const helper = new Helper([
  'adapters/slack.js',
  '../src/untappd-friends.js',
]);

// Alter time as test runs
const originalDateNow = Date.now;
const mockDateNow = () => Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)');
let randomStub;

describe('hubot-untappd-friends for slack', () => {
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
            [
              'hubot',
              {
                attachments: [
                  {
                    color: '#7CD197',
                    fallback: 'heath (heathseals) was drinking Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery at 49 Çukurcuma - an hour ago',
                    footer: '49 Çukurcuma • Earned the Beer Foodie (Level 44) badge and 2 more',
                    footer_icon: 'https://untappd.akamaized.net/badges/bdg_BeerFoodie_sm.jpg',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg',
                    title: 'heath (heathseals) was drinking Blonde Ale by Gara Guzu Brewery',
                    title_link: 'https://untappd.com/user/heathseals/checkin/578981788',
                    ts: 1522432073,
                  },
                  {
                    color: '#7CD197',
                    fallback: 'heath (heathseals) was drinking Efes Pilsen (Pilsner - Other - 5%) by Anadolu Efes at DERALIYE OTTOMAN CUISINE - 8 hours ago',
                    footer: 'DERALIYE OTTOMAN CUISINE • Earned the Beer Connoisseur (Level 8) badge',
                    footer_icon: 'https://untappd.akamaized.net/badges/bdg_connoiseur_sm.jpg',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-EfesPilsener_17259.jpeg',
                    title: 'heath (heathseals) was drinking Efes Pilsen by Anadolu Efes',
                    title_link: 'https://untappd.com/user/heathseals/checkin/578869664',
                    ts: 1522406504,
                  },
                ],
                unfurl_links: false,
              },
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd toast
  it('sends a toast for all latest activity of your friends', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/checkin/recent')
      .query({
        limit: 2,
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/checkin-recent.json`);
    nock('https://api.untappd.com')
      .post('/v4/checkin/toast/578981788')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/toast.json`);
    nock('https://api.untappd.com')
      .post('/v4/checkin/toast/578869664')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/toast.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd toast');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd toast'],
            ['hubot', "🍻 Toasted heath (heathseals)'s Blonde Ale (Blonde Ale - 5%) by Gara Guzu Brewery - https://untappd.com/user/heathseals/checkin/578981788"],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd toast friend
  it('sends a toast for a particular user recent checkin', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/user/checkins/stephenyeargin')
      .query({
        limit: 1,
        USERNAME: 'stephenyeargin',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/user-checkins-stephenyeargin-limit-1.json`);
    nock('https://api.untappd.com')
      .post('/v4/checkin/toast/574773374')
      .query({
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/toast.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd toast stephenyeargin');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd toast stephenyeargin'],
            ['hubot', "🍻 Toasted Stephen (stephenyeargin)'s Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company - https://untappd.com/user/stephenyeargin/checkin/574773374"],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_name: 'an hour ago at 49 Çukurcuma',
                    color: '#7CD197',
                    fallback: 'heath (heathseals) earned the Beer Foodie (Level 44) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago - https://untappd.com/user/heathseals/checkin/578981788',
                    footer: 'Blonde Ale',
                    footer_icon: 'https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg',
                    thumb_url: 'https://untappd.akamaized.net/badges/bdg_BeerFoodie_sm.jpg',
                    title: 'heath (heathseals) earned the Beer Foodie (Level 44) Badge',
                    title_link: 'https://untappd.com/user/heathseals/checkin/578981788',
                  },
                  {
                    author_name: 'an hour ago at 49 Çukurcuma',
                    color: '#7CD197',
                    fallback: 'heath (heathseals) earned the 99 Bottles (Level 38) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago - https://untappd.com/user/heathseals/checkin/578981788',
                    footer: 'Blonde Ale',
                    footer_icon: 'https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg',
                    thumb_url: 'https://untappd.akamaized.net/badges/bdg_99Bottles_sm.jpg',
                    title: 'heath (heathseals) earned the 99 Bottles (Level 38) Badge',
                    title_link: 'https://untappd.com/user/heathseals/checkin/578981788',
                  },
                  {
                    author_name: 'an hour ago at 49 Çukurcuma',
                    color: '#7CD197',
                    fallback: 'heath (heathseals) earned the Pizza & Brew (Level 4) Badge after drinking a Blonde Ale at 49 Çukurcuma - an hour ago - https://untappd.com/user/heathseals/checkin/578981788',
                    footer: 'Blonde Ale',
                    footer_icon: 'https://untappd.akamaized.net/site/beer_logos/beer-764911_07c43_sm.jpeg',
                    thumb_url: 'https://untappd.akamaized.net/badges/bdg_PizzaAndBrew_sm.jpg',
                    title: 'heath (heathseals) earned the Pizza & Brew (Level 4) Badge',
                    title_link: 'https://untappd.com/user/heathseals/checkin/578981788',
                  },
                  {
                    author_name: '8 hours ago at DERALIYE OTTOMAN CUISINE',
                    color: '#7CD197',
                    fallback: 'heath (heathseals) earned the Beer Connoisseur (Level 8) Badge after drinking a Efes Pilsen at DERALIYE OTTOMAN CUISINE - 8 hours ago - https://untappd.com/user/heathseals/checkin/578869664',
                    footer: 'Efes Pilsen',
                    footer_icon: 'https://untappd.akamaized.net/site/beer_logos/beer-EfesPilsener_17259.jpeg',
                    thumb_url: 'https://untappd.akamaized.net/badges/bdg_connoiseur_sm.jpg',
                    title: 'heath (heathseals) earned the Beer Connoisseur (Level 8) Badge',
                    title_link: 'https://untappd.com/user/heathseals/checkin/578869664',
                  },
                ],
                unfurl_links: false,
              },
            ],
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
            [
              'hubot',
              {
                unfurl_links: false,
                attachments: [
                  {
                    color: '#7CD197',
                    fields: [
                      {
                        short: true,
                        title: 'Joined',
                        value: 'Mar 30, 2018',
                      },
                      {
                        short: true,
                        title: 'Beers',
                        value: 699,
                      },
                      {
                        short: true,
                        title: 'Checkins',
                        value: 1056,
                      },
                      {
                        short: true,
                        title: 'Badges',
                        value: 659,
                      },
                    ],
                    thumb_url: 'https://gravatar.com/avatar/cd8e64b56de7d6c766d895a7b257322d?size=100&d=https%3A%2F%2Fassets.untappd.com%2Fsite%2Fassets%2Fimages%2Fdefault_avatar_v3_gravatar.jpg%3Fv%3D2',
                    title: 'Stephen (stephenyeargin)',
                    title_link: 'https://untappd.com/user/stephenyeargin',
                    fallback: 'Stephen (stephenyeargin): 699 beers, 1056 checkins, 659 badges',
                  },
                  {
                    color: '#7CD197',
                    fallback: 'Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company',
                    footer: 'at Yazoo Brewing Company',
                    footer_icon: 'https://untappd.akamaized.net/venuelogos/venue_8193_b107acce_bg_88.png',
                    thumb_url: 'https://untappd.akamaized.net/site/assets/images/temp/badge-beer-default.png',
                    title: 'Spring Seasonal (Belgian Strong Golden Ale - 6%) by Yazoo Brewing Company',
                    title_link: 'https://untappd.com/user/stephenyeargin/checkin/574773374',
                    ts: 1521412006,
                  },
                  {
                    color: '#7CD197',
                    fallback: 'Hopry (IPA - Imperial / Double - 7.9%) by Yazoo Brewing Company',
                    footer: 'at Yazoo Brewing Company',
                    footer_icon: 'https://untappd.akamaized.net/venuelogos/venue_8193_b107acce_bg_88.png',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-1040813_0a48f_sm.jpeg',
                    title: 'Hopry (IPA - Imperial / Double - 7.9%) by Yazoo Brewing Company',
                    title_link: 'https://untappd.com/user/stephenyeargin/checkin/574768822',
                    ts: 1521411528,
                  },
                ],
              },
            ],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    author_link: 'http://www.EastNashBeerWorks.com',
                    author_name: 'East Nashville Beer Works (Nashville, TN)',
                    color: '#7CD197',
                    fallback: 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    text: 'American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-1130814_bd18d_sm.jpeg',
                    title: 'Miro Miel (Blonde Ale)',
                    title_link: 'https://untappd.com/beer/1130814',
                    mrkdwn_in: ['text'],
                    fields: [
                      {
                        short: true,
                        title: 'ABV',
                        value: '5.2%',
                      },
                      {
                        short: true,
                        title: 'IBU',
                        value: 15,
                      },
                    ],
                  },
                ],
                unfurl_links: false,
              },
            ],
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://untappd.akamaized.net/site/brewery_logos/brewery-23273_0d04d.jpeg',
                    author_link: 'http://www.brouemont.com',
                    author_name: 'Brouemont Micro-Brasserie & Restaurant (Bromont, QC)',
                    color: '#7CD197',
                    fallback: 'Framboise Et Miel [Out of Production] (Fruit Beer - 5%) by Brouemont Micro-Brasserie & Restaurant',
                    text: '',
                    thumb_url: 'https://untappd.akamaized.net/site/assets/images/temp/badge-beer-default.png',
                    title: 'Framboise Et Miel [Out of Production] (Fruit Beer)',
                    title_link: 'https://untappd.com/beer/352951',
                    mrkdwn_in: ['text'],
                    fields: [
                      {
                        short: true,
                        title: 'ABV',
                        value: '5%',
                      },
                    ],
                  },
                ],
                unfurl_links: false,
              },
            ],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    author_link: 'http://www.EastNashBeerWorks.com',
                    author_name: 'East Nashville Beer Works (Nashville, TN)',
                    color: '#7CD197',
                    fallback: 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    text: 'American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-1130814_d49be_sm.jpeg',
                    title: 'Miro Miel (Blonde Ale)',
                    title_link: 'https://untappd.com/beer/1130814',
                    mrkdwn_in: ['text'],
                    fields: [
                      {
                        short: true,
                        title: 'Rating',
                        value: '3.62 (1,771 ratings)',
                      },
                      {
                        short: true,
                        title: 'ABV',
                        value: '5.2%',
                      },
                      {
                        short: true,
                        title: 'IBU',
                        value: 15,
                      },
                    ],
                  },
                ],
                unfurl_links: false,
              },
            ],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    author_link: 'http://www.EastNashBeerWorks.com',
                    author_name: 'East Nashville Beer Works (Nashville, TN)',
                    color: '#7CD197',
                    fallback: 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    text: 'American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-1130814_d49be_sm.jpeg',
                    title: 'Miro Miel (Blonde Ale)',
                    title_link: 'https://untappd.com/beer/1130814',
                    mrkdwn_in: ['text'],
                    fields: [
                      {
                        short: true,
                        title: 'Rating',
                        value: '3.62 (1,771 ratings)',
                      },
                      {
                        short: true,
                        title: 'ABV',
                        value: '5.2%',
                      },
                      {
                        short: true,
                        title: 'IBU',
                        value: 15,
                      },
                    ],
                  },
                ],
                unfurl_links: false,
              },
            ],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    author_link: 'http://www.EastNashBeerWorks.com',
                    author_name: 'East Nashville Beer Works (Nashville, TN)',
                    color: '#7CD197',
                    fallback: 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works - American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    text: 'American Style Blonde Ale brewed with Pilsner malt and locally sourced honey. Gives a nice crisp, malty finish, refreshing and light brew. Our honey ...',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-1130814_d49be_sm.jpeg',
                    title: 'Miro Miel (Blonde Ale)',
                    title_link: 'https://untappd.com/beer/1130814',
                    mrkdwn_in: ['text'],
                    fields: [
                      {
                        short: true,
                        title: 'Rating',
                        value: '3.62 (1,771 ratings)',
                      },
                      {
                        short: true,
                        title: 'ABV',
                        value: '5.2%',
                      },
                      {
                        short: true,
                        title: 'IBU',
                        value: 15,
                      },
                    ],
                  },
                ],
                unfurl_links: false,
              },
            ],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    color: '#7CD197',
                    title: 'East Nashville Beer Works',
                    title_link: 'https://untappd.com/brewery/209759',
                    text: null,
                    fallback: 'East Nashville Beer Works (Nashville, TN) - 27 beers - https://untappd.com/brewery/209759',
                    thumb_url: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    fields: [
                      {
                        short: true,
                        title: 'Location',
                        value: 'Nashville, TN',
                      },
                      {
                        short: true,
                        title: 'Beers',
                        value: '27',
                      },
                    ],
                    mrkdwn_in: ['text'],
                  },
                ],
                unfurl_links: false,
              },
            ],
            [
              'hubot',
              {
                attachments: [
                  {
                    color: '#7CD197',
                    title: 'East Nashville Beerworks',
                    title_link: 'https://untappd.com/brewery/301934',
                    fallback: 'East Nashville Beerworks - 4 beers - https://untappd.com/brewery/301934',
                    thumb_url: 'https://untappd.akamaized.net/site/assets/images/temp/badge-brewery-default.png',
                    text: null,
                    fields: [
                      {
                        short: true,
                        title: 'Beers',
                        value: '4',
                      },
                    ],
                    mrkdwn_in: ['text'],
                  },
                ],
                unfurl_links: false,
              },
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  // hubot untappd brewery <id>
  it('responds with the brewery info for an ID', (done) => {
    nock('https://api.untappd.com')
      .get('/v4/brewery/info/301934')
      .query({
        BREWERY_ID: '301934',
        access_token: 'foobar3',
      })
      .replyWithFile(200, `${__dirname}/fixtures/search-brewery-by-id.json`);

    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot untappd brewery 301934');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot untappd brewery 301934'],
            [
              'hubot',
              {
                attachments: [
                  {
                    color: '#7CD197',
                    fallback: 'East Nashville Beer Works (Nashville, TN) - 24 beers - https://untappd.com/brewery/209759',
                    fields: [
                      {
                        short: true,
                        title: 'Location',
                        value: 'Nashville, TN',
                      },
                      {
                        short: true,
                        title: 'Brewery Type',
                        value: 'Micro Brewery',
                      },
                      {
                        short: true,
                        title: 'Beers',
                        value: '24',
                      },
                      {
                        short: true,
                        title: 'Rating',
                        value: '3.59 (8,727 ratings)',
                      },
                    ],
                    mrkdwn_in: [
                      'text',
                    ],
                    text: 'East Nashville Beer Works is a small, neighborhood brewery in East Nashville, Tennessee. A growing and thriving area, our brewery is focused on the taproom, while we do distribute kegs and soon to be cans of our brew. \n\nOur taproom is a community gathering space, with a full food menu centered on artisan pizza, with salads, and apps. We have great outdoor space with our beer garden, and a fun vibe that is also family friendly.',
                    thumb_url: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    title: 'East Nashville Beer Works',
                    title_link: 'https://untappd.com/brewery/209759',
                  },
                ],
                unfurl_links: false,
              },
            ],
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
            ['hubot', 'Howard (hchoularton), Dan (Tacoma_Dan), Ruben (Tecate213), Michael (Boyernator), Lennard (magistraalhardzuipen), Jasper (JasperRusthoven), Wouter (non_will_survive), Jacob (Flintquatch), B (Beer4Brad), Paddy (paddyboy1918), Jimmy V (Jvande0313), Raymond (r4ymond), Josh (JoshRaynes), Roel (rrijks), Frankie (FrankieFierYo), Jim (jimmcm88), Sean (sean_themighty), Tom (Mostreytom), Luke (lukepillar), Jake (JakeWinstone), Maurice (Maurice079), Jonathan (jonnybgoode82), Craig (Arcticwolf8), Kayleigh (_Kayleigh_), Dustin (droberts5)'],
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://untappd.akamaized.net/site/brewery_logos/brewery-209759_6b314.jpeg',
                    author_link: 'http://www.EastNashBeerWorks.com',
                    author_name: 'East Nashville Beer Works (Nashville, TN)',
                    color: '#7CD197',
                    fallback: 'Miro Miel (Blonde Ale - 5.2%) by East Nashville Beer Works',
                    text: '',
                    thumb_url: 'https://untappd.akamaized.net/site/beer_logos/beer-1130814_d49be_sm.jpeg',
                    title: 'Miro Miel (Blonde Ale)',
                    title_link: 'https://untappd.com/beer/1130814',
                    mrkdwn_in: ['text'],
                    fields: [
                      {
                        short: true,
                        title: 'Rating',
                        value: '3.62 (1,771 ratings)',
                      },
                      {
                        short: true,
                        title: 'ABV',
                        value: '5.2%',
                      },
                      {
                        short: true,
                        title: 'IBU',
                        value: 15,
                      },
                    ],
                  },
                ],
                unfurl_links: false,
              },
            ],
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
