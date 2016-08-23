'use strict';

const agent = require(SRC_ROOT + '/dmm/agent');
const async = require('async');
const dmmAuth = require('../mock/dmm/auth');

describe('DMM agent', function() {

	it('login with empty email', function(done) {
		async.each(['', '      '], function(email, callback) {
			var password = '1234';
			agent.login(email, password, function(error, isSuccess) {
				assert.isNotNull(error);
				callback();
			})
		}, done);
	})

	it('login with empty password', function(done) {
		async.each(['', '      '], function(password, callback) {
			var email = 'poi@poi.com';
			agent.login(email, password, function(error, isSuccess) {
				assert.isNotNull(error);
				callback();
			})
		}, done);
	})

	it('scrape login token from DMM login page', function(done) {
		agent.scrapeToken(function(error, DMM_TOKEN, DATA_TOKEN) {
			assert.isNull(error, 'should have no error');
			assert.equal(DMM_TOKEN, dmmAuth.token.dmm, 'DMM token should be equal');
			assert.equal(DATA_TOKEN, dmmAuth.token.data, 'data token should be equal');
			done();
		});
	})

	it('authroize token', function(done) {
		agent.authorizeToken(dmmAuth.token.dmm, dmmAuth.token.data, function(error, authToken) {
			assert.isNull(error);
			assert.equal(authToken.token, dmmAuth.token.auth.token);
			assert.equal(authToken.login_id, dmmAuth.token.auth.login_id);
			assert.equal(authToken.password, dmmAuth.token.auth.password);
			done();
		});
	})

	it('authentication using token success', function(done) {
		agent.authenticate('some@one.com', 'password', dmmAuth.token.auth, function(error, cookie) {
			assert.isNull(error, 'there should be no error');
			assert.equal(cookie, dmmAuth.session);
			done();
		});
	})

	it('authentication using token fail due to incorrect email or password', function(done) {
		agent.authenticate(dmmAuth.badAccount.email, dmmAuth.badAccount.password, dmmAuth.token.auth, function(error, isSuccess) {
			assert.isNull(error, 'there should be no error');
			assert.isFalse(isSuccess, 'login should fail');
			done();
		})
	});

	it('login success', function(done) {
		agent.login('some@one.com', 'password', function(error, cookie) {
			assert.isNull(error, 'there should be no error');
			assert.equal(cookie, dmmAuth.session);
			done();
		})
	})

	it('login fail', function(done) {
		agent.login(dmmAuth.badAccount.email, dmmAuth.badAccount.password, function(error, cookie) {
			assert.isNull(error, 'there should be no error');
			assert.isBoolean(cookie, 'should be boolean');
			assert.isFalse(cookie, 'login should fail');
			done();
		})
	})
})
