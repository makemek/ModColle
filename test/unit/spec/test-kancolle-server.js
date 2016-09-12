'use strict';

const Agent = require(SRC_ROOT + '/kancolle/server/server');
const sinon = require('sinon');
const request = require('request');
const kancolleExternal = require(SRC_ROOT + '/kancolle/external');
const path = require('path');
const osapi = require(SRC_ROOT + '/dmm/osapi');
const playerProfile = require('../mock/kancolle/api-terminal');
const urljoin = require('url-join');
const stream = new require('stream').Readable();
const nock = require('nock');

describe('kancolle server', function() {

	var agent;
	const KANCOLLE_CONFIG = {
		baseDir: 'base',
		serv: 'http://0.0.0.0'
	}

	beforeEach(function() {
		agent = new Agent(1, KANCOLLE_CONFIG.serv);
	})

	it('download from the internet', function(done) {
		var sensitiveParams = '?api_token=abc&api_starttime=1234';
		var url = 'http://www.example.com/';

		nock(url)
		.get('/')
		.reply(200);

		stream.end = done;
		var req = agent.download(urljoin(url, sensitiveParams));
		req.pipe(stream);

		assert.equal(req.uri.href, url, 'should not contain api token query parameter');
		assert.isTrue(req.headers['x-requested-with'].startsWith('ShockwaveFlash/'), 'should set header x-requested-with ShockwaveFlash');
	})

	it('call API', sinon.test(function() {
		var url = 'http://api.example.com';
		var req = {
			body: {},
			headers: {someHeader: 'header'}
		}
		var reqStub = this.stub(req);
		var httpPost = this.stub(request, 'post');
		this.stub(kancolleExternal, 'host').returns(KANCOLLE_CONFIG.serv);

		agent.apiRequest(url, reqStub, function(){});

		sinon.assert.calledOnce(httpPost);
		var postArgs = httpPost.firstCall.args[0];
		expect(postArgs.url).to.equal(url);
		expect(postArgs.headers.host).to.equal(KANCOLLE_CONFIG.serv);
		expect(postArgs.headers.origin).to.include(KANCOLLE_CONFIG.serv);
		expect(postArgs.headers['connection']).to.not.exist;
		expect(postArgs.headers['content-length']).to.not.exist;
		expect(postArgs.headers['content-type']).to.not.exist;
		expect(postArgs.headers.someHeader).to.equal(req.headers.someHeader);
	}))

	it('generate api token for non-banned player', function(done) {
		agent.generateApiToken({VIEWER_ID: playerProfile.oldPlayer.dmmId, ST: 'xxxxxxxxx'})
		.then(player => {
			assert.isFalse(player.isBan, 'should not get banned');
			done();
		})
		.catch(done);
	})

	it('NOT generate api token for banned player', sinon.test(function(done) {
		var body = 'svdata=' + JSON.stringify({api_result: 301})
		var stub = this.stub(osapi, 'proxyRequest').returns(Promise.resolve({body: body}));
		agent.generateApiToken({})
		.then(player => {
			assert.isTrue(player.isBan, 'this player should be banned');
			assert.isUndefined(player.api_token, 'no api token should be given');
			assert.isUndefined(player.api_start_time, 'no api start time should be given');
			done();
		})
		.catch(done);
	}))

})
