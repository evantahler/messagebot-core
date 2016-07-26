var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;
var messageGuid;
var team;
var otherMessage;

describe('actions:message', function(){
  before(function(){ api = specHelper.api; });

  before(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  before(function(done){
    otherMessage = new api.models.message(team);
    otherMessage.data.personGuid  = 'abc123';
    otherMessage.data.transport   = 'smtp';
    otherMessage.data.campaignId  = 1;
    otherMessage.data.body        = '';
    otherMessage.data.view        = {};
    otherMessage.data.sentAt      = new Date();

    otherMessage.create(done);
  });

  after(function(done){ otherMessage.del(done); });

  describe('message:create', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        sync: true,
        personGuid: 'abc123',
        transport: 'smtp',
        campaignId: 1,
        body: 'hello',
        view: {},
        sentAt: new Date(),
      }, function(response){
        should.not.exist(response.error);
        should.exist(response.guid);
        messageGuid = response.guid;
        done();
      });
    });

    it('fails (uniqueness failure)', function(done){
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        sync: true,
        guid: messageGuid,
        personGuid: 'abc123',
        transport: 'smtp',
        campaignId: 1,
        body: 'hello',
        view: {},
        sentAt: new Date(),
      }, function(response){
        response.error.should.equal('Error: uniqueFields:guid uniqueness violated via #' + messageGuid);
        done();
      });
    });

    it('fails (missing param)', function(done){
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        sync: true,
        transport: 'smtp',
        campaignId: 1,
        body: 'hello',
        view: {},
        sentAt: new Date(),
      }, function(response){
        response.error.should.equal('Error: personGuid is a required parameter for this action');
        done();
      });
    });
  });

  describe('message:view', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('message:view', {
        teamId: team.id,
        guid: messageGuid
      }, function(response){
        should.not.exist(response.error);
        response.message.guid.should.equal(messageGuid);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('message:view', {
        teamId: team.id,
        guid: 'xxx'
      }, function(response){
        response.error.should.equal('Error: message (xxx) not found');
        done();
      });
    });
  });

  describe('message:edit', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('message:edit', {
        teamId: team.id,
        guid: messageGuid,
        body: 'hello again',
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('message:edit', {
        teamId: team.id,
        guid: 'xxx'
      }, function(response){
        response.error.should.equal('Error: message (xxx) not found');
        done();
      });
    });
  });

  describe('message:track', function(){
    var eventGuids = [];

    after(function(done){
      var jobs = [];
      eventGuids.forEach(function(e){
        jobs.push(function(next){
          var event = new api.models.event(team, e);
          event.del(next);
        });
      });

      async.series(jobs, done);
    });

    it('succeeds (read, json)', function(done){
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'read',
      }, function(response){
        should.not.exist(response.error);
        should.exist(response.eventGuid);
        eventGuids.push(response.eventGuid);
        done();
      });
    });

    it('succeeds (act, json)', function(done){
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'act',
      }, function(response){
        should.not.exist(response.error);
        should.exist(response.eventGuid);
        eventGuids.push(response.eventGuid);
        done();
      });
    });

    it('succeeds (read, html)', function(done){
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'read',
      }, function(response, res){
        should.not.exist(response.error);
        should.exist(response.eventGuid);
        res.statusCode.should.equal(200);
        eventGuids.push(response.eventGuid);
        done();
      });
    });

    it('succeeds (act, html)', function(done){
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'act',
      }, function(response, res){
        should.not.exist(response.error);
        should.exist(response.eventGuid);
        res.statusCode.should.equal(200);
        eventGuids.push(response.eventGuid);
        done();
      });
    });

    it('succeeds (read, gif)', function(done){
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track.gif', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'read',
      }, function(response, res){
        response.toString().indexOf('GIF').should.equal(0);
        res.statusCode.should.equal(200);
        res.headers['x-powered-by'].should.equal('MessageBot API');
        res.headers['content-type'].should.equal('image/gif');
        done();
      });
    });

    it('succeeds (act, gif)', function(done){
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track.gif', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'act',
      }, function(response, res){
        response.toString().indexOf('GIF').should.equal(0);
        res.statusCode.should.equal(200);
        res.headers['x-powered-by'].should.equal('MessageBot API');
        res.headers['content-type'].should.equal('image/gif');
        done();
      });
    });

    it('succeeds (message timestamps updated)', function(done){
      api.specHelper.runAction('message:view', {
        teamId: team.id,
        guid: messageGuid
      }, function(response){
        should.not.exist(response.error);
        response.message.guid.should.equal(messageGuid);
        should.exist(response.message.readAt);
        should.exist(response.message.actedAt);
        done();
      });
    });

    it('fails (bad verb)', function(done){
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: messageGuid,
        sync: true,
        verb: 'did-it',
      }, function(response){
        response.error.should.equal('Error: verb not allowed');
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: 'abc123',
        sync: true,
        verb: 'act',
      }, function(response){
        response.error.should.equal('Error: message (abc123) not found');
        done();
      });
    });
  });

  describe('messages:search', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'messages:search', {
        searchKeys: ['personGuid'],
        searchValues: ['abc123'],
        form: 0,
        size: 1,
      }, function(response){
        should.not.exist(response.error);
        response.total.should.equal(2);
        response.messages.length.should.equal(1);
        done();
      });
    });

    it('fails (not logged in)', function(done){
      api.specHelper.runAction('people:search', {
        searchKeys: ['personGuid'],
        searchValues: ['abc123'],
      }, function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });
  });

  describe('messages:aggregation', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'messages:aggregation', {
        searchKeys: ['personGuid'],
        searchValues: ['abc123'],
        interval: 'day',
      }, function(response){
        should.not.exist(response.error);
        Object.keys(response.aggregations).length.should.equal(2);
        response.aggregations._all[0].doc_count.should.equal(2);
        response.aggregations.smtp[0].doc_count.should.equal(2);
        response.selections.should.deepEqual(['smtp']);
        response.selectionsName.should.equal('transports');
        done();
      });
    });

    it('fails (not logged in)', function(done){
      api.specHelper.runAction('messages:aggregation', {
        searchKeys: ['personGuid'],
        searchValues: ['abc123'],
        interval: 'day',
      }, function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });
  });

  describe('message:delete', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('message:delete', {
        teamId: team.id,
        sync: true,
        guid: messageGuid
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('message:delete', {
        teamId: team.id,
        sync: true,
        guid: messageGuid
      }, function(response){
        response.error.should.equal('Error: message (' + messageGuid + ') not found');
        done();
      });
    });
  });

});
