var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;

describe('actions:event', function(){
  before(function(){ api = specHelper.api; });

  describe('event:create', function(){
    it('succeeds');
    it('succeeds (geocoding)');
    it('succeeds (updates the person)');
    it('fails (uniqueness failure)');
    it('fails (missing param)');
  });

  describe('event:view', function(){
    it('succeeds');
    it('fails (not found)');
  });

  describe('event:edit', function(){
    it('succeeds');
    it('fails (uniqueness failure)');
  });

  describe('events:search', function(){
    it('succeeds');
    it('fails (not logged in)');
  });

  describe('events:aggregation', function(){
    it('succeeds');
    it('fails (not logged in)');
  });

  describe('event:delete', function(){
    it('succeeds');
    it('fails (not found)');
  });

});
