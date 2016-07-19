'use strict';

const DmmAccount = require('../../src/dmm/account');
const sinon = require('sinon');
const rp = require('request-promise');
const sprintf = require("sprintf-js").sprintf
const async = require('async');
const dmmAuth = require('../mock/dmm/auth');

describe('DMM account', function() {

	var taskList, fakeAccount;
	beforeEach(sinon.test(function() {
		var procedure = this.stub(async, 'waterfall');
		fakeAccount = new DmmAccount('jon@example.com', '1234');
		fakeAccount.login();
		taskList = procedure.firstCall.args[0];
	}))

	it('empty email', sinon.test(function() {
		var account = new DmmAccount('', '1234');
		expectError(account);
		account = new DmmAccount('     ', '1234');
		expectError(account);
	}))

	it('empty password', sinon.test(function() {
		var email = 'john@example.com';
		var account = new DmmAccount(email, '');
		expectError(account);
		account = new DmmAccount(email, '      ');
		expectError(account);
	}))

	it('scrape login token from DMM login page', function(done) {		
		var scrpeTask = taskList[0];

		scrpeTask(function(error, DMM_TOKEN, DATA_TOKEN) {
			assert.isNull(error, 'should have no error');
			assert.equal(DMM_TOKEN, dmmAuth.token.dmm, 'DMM token should be equal');
			assert.equal(DATA_TOKEN, dmmAuth.token.data, 'data token should be equal');
			done();
		});
	})

	it('authroize token', function(done) {
		var taskAuthorize = taskList[1];
		
		taskAuthorize(dmmAuth.token.dmm, dmmAuth.token.data, function(error, authToken) {
			assert.isNull(error);
			assert.equal(authToken.token, dmmAuth.token.auth.token);
			assert.equal(authToken.login_id, dmmAuth.token.auth.login_id);
			assert.equal(authToken.password, dmmAuth.token.auth.password);
			done();
		});
	})

	it('authentication success', function(done) {
		var taskAuthenticate = taskList[2];
		taskAuthenticate(dmmAuth.token.auth, function(error, isSuccess) {
			assert.isNull(error, 'there should be no error');
			assert.isBoolean(isSuccess, 'should indicate whether the login is success (email and password are correct)');
			assert.isTrue(isSuccess, 'authentication should success');

			var sessionCookie = fakeAccount.getCookie();
			assert.equal(sessionCookie, dmmAuth.session);
			done();
		});
	})

	it('authentication fail due to incorrect email or password', sinon.test(function(done) {
		var badAccount = new DmmAccount(dmmAuth.badAccount.email, dmmAuth.badAccount.password);
		var procedure = this.stub(async, 'waterfall');
		badAccount.login();

		var taskAuthenticate = procedure.firstCall.args[0][2];
		taskAuthenticate(dmmAuth.token.auth, function(error, isSuccess) {
			assert.isNull(error, 'there should be no error');
			assert.isFalse(isSuccess, 'login should fail');
			done();
		})
	}));
})

function expectError(account) {
	var accountCallback = sinon.spy();

	account.login(accountCallback);

	sinon.assert.calledOnce(accountCallback);
	var error = accountCallback.args[0][0];
	expect(error).to.be.an('error');

	return error;
}
