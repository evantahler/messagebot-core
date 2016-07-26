var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;
var eventGuid;
var team;

describe('actions:event', function(){
  before(function(){ api = specHelper.api; });

  before(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  describe('event:create', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('event:create', {
        teamId: team.id,
        sync: true,
        device: 'tester',
        type: 'tester',
        personGuid: 'eventTestGuid',
        data: {thing: 'stuff'},
      }, function(response){
        should.not.exist(response.error);
        should.exist(response.guid);
        eventGuid = response.guid;
        done();
      });
    });

    it('succeeds (GIF)', function(done){
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/event/create.gif', {
        teamId: team.id,
        sync: true,
        device: 'tester',
        type: 'tester',
        personGuid: 'eventTestGuid',
      }, function(response, res){
        response.toString().indexOf('GIF').should.equal(0);
        res.statusCode.should.equal(200);
        res.headers['x-powered-by'].should.equal('MessageBot API');
        res.headers['content-type'].should.equal('image/gif');
        done();
      });
    });

    it('succeeds (geocoding)', function(done){
      api.specHelper.runAction('event:create', {
        teamId: team.id,
        sync: true,
        device: 'tester',
        type: 'tester',
        personGuid: 'eventTestGuid',
        data: {thing: 'stuff'},
        ip: '173.247.192.214'
      }, function(response){
        should.not.exist(response.error);
        should.exist(response.guid);

        var event = new api.models.event(team, response.guid);
        event.hydrate(function(error){
          should.not.exist(error);
          Math.round(event.data.location.lat).should.equal(38);
          Math.round(event.data.location.lon).should.equal(-122);
          done();
        });
      });
    });

    it('succeeds (updates the person)');

    it('fails (missing param)', function(done){
      api.specHelper.runAction('event:create', {
        teamId: team.id,
        sync: true,
        type: 'tester',
        personGuid: 'eventTestGuid',
        data: {thing: 'stuff'},
      }, function(response){
        response.error.should.equal('Error: device is a required parameter for this action');
        done();
      });
    });
  });

  describe('event:view', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('event:view', {
        teamId: team.id,
        guid: eventGuid
      }, function(response){
        should.not.exist(response.error);
        response.event.data.thing.should.equal('stuff');
        response.event.personGuid.should.equal('eventTestGuid');
        should.exist(response.event.createdAt);
        should.exist(response.event.updatedAt);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('event:view', {
        teamId: team.id,
        guid: '123abc'
      }, function(response){
        response.error.should.equal('Error: event (123abc) not found');
        done();
      });
    });
  });

  describe('event:edit', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('event:edit', {
        teamId: team.id,
        guid: eventGuid,
        device: 'new_device'
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('event:edit', {
        teamId: team.id,
        guid: '123abc',
        device: 'new_device'
      }, function(response){
        response.error.should.equal('Error: event (123abc) not found');
        done();
      });
    });
  });

  describe('events:search', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'events:search', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
        form: 0,
        size: 99,
      }, function(response){
        should.not.exist(response.error);
        response.total.should.equal(1);
        response.events.length.should.equal(1);
        done();
      });
    });

    it('fails (not logged in)', function(done){
      api.specHelper.runAction('people:search', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
      }, function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });
  });

  describe('events:aggregation', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'events:aggregation', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
        interval: 'day',
      }, function(response){
        should.not.exist(response.error);
        Object.keys(response.aggregations).length.should.equal(2);
        response.aggregations.tester[0].doc_count.should.equal(1);
        response.selections.should.deepEqual(['tester']);
        response.selectionsName.should.equal('types');
        done();
      });
    });

    it('fails (not logged in)', function(done){
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
      }, function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });
  });

  describe('event:delete', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('event:delete', {
        teamId: team.id,
        guid: eventGuid,
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('event:delete', {
        teamId: team.id,
        guid: eventGuid,
      }, function(response){
        response.error.should.equal('Error: event (' + eventGuid + ') not found')
        done();
      });
    });
  });

});
