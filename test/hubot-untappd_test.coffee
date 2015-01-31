chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

describe 'hubot-untappd', ->
  beforeEach ->
    @robot =
      respond: sinon.spy()
      hear: sinon.spy()

    require('../src/hubot-untappd')(@robot)

  it 'registers a respond listener for Untappd', ->
    expect(@robot.respond).to.have.been.calledWith(/untappd$/i)

  it 'registers a respond listener for Untappd queries', ->
    expect(@robot.respond).to.have.been.calledWith(/untappd (.+) (.+)/i)

  it 'registers a respond listener for Untappd actions', ->
    expect(@robot.respond).to.have.been.calledWith(/untappd (register|approve|friends)/i)
