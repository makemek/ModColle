'use strict';

const async = require('async');
const request = require('supertest-as-promised');
const sprintf = require('sprintf-js').sprintf;
const app = require('../../../src/');
const nconf = require('nconf');
const sinon = require('sinon');
const nock = require('nock');
const Agent = require('../../../src/kancolle/server/server');
const path = require('path');

describe('request kancolle world server image', function() {

	var serverIp = ipPattern();

	async.forEach(serverIp, function(ipAddress) {
		it('by ip address ' + ipAddress, sinon.test(function(done) {
			nockServerImage(ipAddress);

			var agent = new Agent(ipAddress);
			var config = this.stub(nconf, 'get');
			var loadSpy = this.spy(Agent, 'load');

			config.withArgs('MY_WORLD_SERVER').returns(ipAddress);
			config.withArgs('KANCOLLE_BASE_DIR').returns('*no_where*');

			var uri = sprintf('/resources/image/world/%s_t.png', '001_002_003_004');
			request(app)
			.get(uri)
			.expect(200)
			.then(function(res) {
				var imageNamePattern = /\d{3}_\d{3}_\d{3}_\d{3}_t\.png/
				var imagePath = loadSpy.firstCall.args[1];
				var imageName = path.basename(imagePath);

				assert.startsWith(imagePath, '/resources/image/world');
				assert.match(imageName, imageNamePattern);

				var resultIp = imageName.replace('_t.png', '').split('_').map(Number);
				var expectIp = ipAddress.split('.').map(Number);
				assert.deepEqual(resultIp, expectIp);
				done();
			})
			.catch(done)
		}))
	})

	it('by host name', sinon.test(function(done) {
		var hostname = 'www.example.com';
		var expectedImageName = 'www_example_com_t.png';

		var config = this.stub(nconf, 'get');
		var loadSpy = this.spy(Agent, 'load');

		config.withArgs('MY_WORLD_SERVER').returns(hostname);
		config.withArgs('KANCOLLE_BASE_DIR').returns('*no_where*');

		var uri = sprintf('/resources/image/world/%s_t.png', hostname);
		nockServerImage(hostname);
		request(app)
		.get(uri)
		.expect(200)
		.then(function(res) {
			var imagePath = loadSpy.firstCall.args[1];
			var imageName = path.basename(imagePath);

			assert.startsWith(imagePath, '/resources/image/world');
			assert.equal(imageName, expectedImageName)
			done();
		})
		.catch(done);
	}))

	function ipPattern() {
		return [
		'1.1.1.1', '11.1.1.1', '111.1.1.1',
		'1.11.1.1', '1.111.1.1',
		'1.1.11.1', '1.1.111.1',
		'1.1.1.11', '1.1.1.111'
		]
	}

	function nockServerImage(host) {
		nock('http://' + host)
		.get(/\/resources\/image\/world\/.*\_t\.png/)
		.reply(200)
	}
})

describe('request resource from kancolle server', function() {

	var agent;

	before(function() {
		agent = new Agent('1.1.1.1');
	})

	async.forEach(['file.swf', 'sound/file.mp3', 'file.png'], function(file) {

		it('request ' + file, sinon.test(function(done) {
			var host = agent.host;
			var config = this.stub(nconf, 'get');
			config.withArgs('MY_WORLD_SERVER').returns(agent.host);
			config.withArgs('KANCOLLE_BASE_DIR').returns('*no_where*');

			nockKancolleResource(agent.host, file);
			
			request(app)
			.get('/' + file)
			.then(function(res) {
				done();
			})
			.catch(done)
		}))
	})

	function nockKancolleResource(host, file) {
		nock('http://' + host)
		.get('/kcs/' + file)
		.reply(200)
	}
})