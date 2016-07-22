var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var api;

describe('actions:campaign', function(){
  beforeEach(function(){ api = specHelper.api; });

  describe('campaign:create', function(){
    it('success');
    it('failure (missing param)');
    it('failure (uniqueness failure)');
  });

  describe('campaign:view', function(){
    it('success');
    it('failure (not found)');
  });

  describe('campaign:copy', function(){
    it('success');
  });

  describe('campaign:edit', function(){
    it('success');
    it('failure (uniqueness failure)');
  });

  describe('campaign:stats', function(){
    it('success');
  });

  describe('campaign:delete', function(){
    it('success');
    it('failure (not found)');
  });

  describe('campaign:types', function(){
    it('success');
  });

  describe('campaign:list', function(){
    it('success');
  });

  describe('campaign:folders', function(){
    it('success');
  });

});
