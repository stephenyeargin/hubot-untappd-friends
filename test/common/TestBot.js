const path = require('path');
const { Robot, TextMessage } = require('hubot');
const nock = require('nock');
const script = require('../../src/untappd-friends');

class TestBotContext {
  constructor(robot, user) {
    this.robot = robot; this.user = user;
    this.sends = []; this.replies = [];
    this.robot.adapter.on('send', (_, strings) => this.sends.push(strings.join('\n')));
    this.robot.adapter.on('reply', (_, strings) => this.replies.push(strings.join('\n')));
    this.nock = nock;
  }

  async send(message) {
    const id = (Math.random() + 1).toString(36).substring(7);
    this.robot.adapter.receive(new TextMessage(this.user, message, id));
    await new Promise((done) => { setTimeout(done, 50); });
  }

  async sendAndWaitForResponse(message, responseType = 'send') {
    return new Promise((done) => {
      this.robot.adapter.once(responseType, (_, strings) => done(strings[0]));
      this.send(message);
    });
  }

  shutdown() {
    delete process.env.UNTAPPD_API_KEY;
    delete process.env.UNTAPPD_API_SECRET;
    delete process.env.UNTAPPD_API_ACCESS_TOKEN;
    delete process.env.UNTAPPD_MAX_COUNT;
    delete process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH;
    delete process.env.UNTAPPD_MAX_RANDOM_ID;
    nock.cleanAll();
    this.robot.shutdown();
  }
}

async function createTestBot(settings = {}) {
  process.env.HUBOT_LOG_LEVEL = 'silent';
  process.env.UNTAPPD_API_KEY = settings.UNTAPPD_API_KEY || 'foobar1';
  process.env.UNTAPPD_API_SECRET = settings.UNTAPPD_API_SECRET || 'foobar2';
  process.env.UNTAPPD_API_ACCESS_TOKEN = settings.UNTAPPD_API_ACCESS_TOKEN || 'foobar3';
  if (settings.UNTAPPD_MAX_COUNT !== undefined) {
    if (settings.UNTAPPD_MAX_COUNT === null) {
      delete process.env.UNTAPPD_MAX_COUNT;
    } else {
      process.env.UNTAPPD_MAX_COUNT = String(settings.UNTAPPD_MAX_COUNT);
    }
  } else {
    process.env.UNTAPPD_MAX_COUNT = '2';
  }
  if (settings.UNTAPPD_MAX_RANDOM_ID !== undefined) {
    if (settings.UNTAPPD_MAX_RANDOM_ID === null) {
      delete process.env.UNTAPPD_MAX_RANDOM_ID;
    } else {
      process.env.UNTAPPD_MAX_RANDOM_ID = String(settings.UNTAPPD_MAX_RANDOM_ID);
    }
  } else {
    process.env.UNTAPPD_MAX_RANDOM_ID = '100';
  }
  if (settings.UNTAPPD_MAX_DESCRIPTION_LENGTH !== undefined) {
    if (settings.UNTAPPD_MAX_DESCRIPTION_LENGTH === null) {
      delete process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH;
    } else {
      process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH = String(settings.UNTAPPD_MAX_DESCRIPTION_LENGTH);
    }
  } else {
    delete process.env.UNTAPPD_MAX_DESCRIPTION_LENGTH;
  }
  nock.cleanAll();
  nock.disableNetConnect();
  const robot = new Robot(path.resolve(__dirname, 'adapter'), false, 'hubot');
  await robot.loadAdapter(path.resolve(__dirname, 'adapter.js'));
  script(robot);
  return new Promise((done) => {
    robot.adapter.on('connected', () => {
      if (settings.adapterName) robot.adapterName = settings.adapterName;
      const user = robot.brain.userForId('1', { name: 'testuser', room: '#testroom' });
      done(new TestBotContext(robot, user));
    });
    robot.run();
  });
}

module.exports = { createTestBot, TestBotContext };
