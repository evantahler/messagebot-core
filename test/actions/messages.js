var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;

describe('actions:message', function(){
  before(function(){ api = specHelper.api; });

  describe('message:create', function(){
    it('succeeds');
    it('fails (uniqueness failure)');
    it('fails (missing param)');
  });

  describe('message:view', function(){
    it('succeeds');
    it('fails (not found)');
  });

  describe('message:edit', function(){
    it('succeeds');
    it('fails (uniqueness failure)');
    it('fails (not found)');
  });

  describe('message:track', function(){
    it('succeeds (read, json)');
    it('succeeds (act, json)');
    it('succeeds (read, html)');
    it('succeeds (act, html)');
    it('succeeds (creates event)');
    it('fails (uniqueness failure)');
  });

  describe('messages:search', function(){
    it('succeeds');
    it('fails (not logged in)');
  });

  describe('messages:aggregation', function(){
    it('succeeds');
    it('fails (not logged in)');
  });

  describe('message:delete', function(){
    it('succeeds');
    it('fails (not found)');
  });

});
