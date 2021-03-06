'use strict'

const hub = require(global.SRC_ROOT + '/kancolle/hub')
const servers = require(global.SRC_ROOT + '/kancolle/server/')
const Server = require(global.SRC_ROOT + '/kancolle/server/server')
const urlparse = require('url-parse')
const sinon = require('sinon')
const game = require(global.SRC_ROOT + '/kancolle/game')
const should = require('should')

const sandbox = sinon.sandbox.create()

describe('Kancolle hub', () => {

  const gadgetInfo = {VIEWER_ID: 1234}

  afterEach(() => {
    sandbox.restore()
  })

  it('return correcct game ID', () => {
    const ID = 854854
    hub.appId.should.equal(ID, 'Kancolle app id should be ' + ID)
  })

  it('request for kancolle server by world id should return a correct server', () => {
    const worldId = '9999', fakeKancolleServer = new Server(worldId)
    servers[worldId] = fakeKancolleServer
    hub.getServer(worldId).should.deepEqual(fakeKancolleServer, 'should return the same server')
    delete servers[worldId]
  })

  it('request for kancolle server by host name should return a correct server', () => {
    const host = 'www.example.com', fakeKancolleServer = new Server('9999999', host)
    servers[host] = fakeKancolleServer
    hub.getServer(host).should.deepEqual(fakeKancolleServer, 'should return the same server')
    delete servers[host]
  })

  it('request non-existent server should return undefined', () => {
    const invalidValue = null
    should.not.exist(hub.getServer(invalidValue))
  })

  it('should return correct url to new player who launch the game', done => {
    sandbox.stub(game, 'getWorldServerId').returns(Promise.resolve(0))
    hub.launch(gadgetInfo)
    .then(url => {
      url.should.equal('http://203.104.209.7/kcs/world.swf')
      done()
    })
    .catch(done)
  })

  it('should return correct url to old player who launch the game', done => {
    const player = {
      isBan: false,
      api_token: 'abc',
      api_start_time: '123'
    }
    const worldId = 1
    sandbox.stub(game, 'getWorldServerId').returns(Promise.resolve(worldId))
    sandbox.stub(Server.prototype, 'generateApiToken').returns(Promise.resolve(player))

    hub.launch(gadgetInfo)
    .then(url => {
      const server = hub.getServer(worldId)
      const expectUrl = urlparse(server.host)
      url = urlparse(url, true)
      url.protocol.should.equal('http:', 'should have http protocol')
      url.host.should.equal(expectUrl.host, 'should have the host')
      url.pathname.should.equal('/kcs/mainD2.swf', 'mainD2.swf should reside in /kcs/')
      url.query.api_token.should.equal(player.api_token, 'should have api token')
      url.query.api_starttime.should.equal(player.api_start_time, 'should have api start time')
      done()
    })
    .catch(done)
  })

  it('should return correct url to old player who is banned from the game', done => {
    sandbox.stub(game, 'getWorldServerId').returns(Promise.resolve(1))
    sandbox.stub(Server.prototype, 'generateApiToken')
    .returns(Promise.resolve({isBan: true}))

    hub.launch(gadgetInfo)
    .then(url => {
      url.should.equal('http://203.104.209.7/kcs/ban.swf', 'url should match')
      done()
    })
    .catch(done)
  })
})
