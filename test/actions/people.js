var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var personGuid;
var team;
var list;
var api;
var otherPerson;

describe('action:person', function(){
  before(function(){ api = specHelper.api; });
  before(function(done){ specHelper.flushRedis(done); });

  before(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  before(function(done){
    otherPerson = new api.models.person(team);
    otherPerson.data.source = 'tester';
    otherPerson.data.device = 'phone';
    otherPerson.data.data = {
      firstName: 'fname',
      lastName: 'lame',
      email: 'otherPerson@faker.fake',
    };

    otherPerson.create(done);
  });

  before(function(done){
    list = api.models.list.build({
      teamId:      1,
      name:        'my list',
      description: 'my list',
      type:        'static',
      folder:      'default'
    });

    list.save().then(function(){ done(); });
  });

  after(function(done){ list.destroy().then(function(){ done(); }); });
  after(function(done){ otherPerson.del(done); });

  describe('person:create', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        sync: true,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake',
        },
      }, function(response){
        should.not.exist(response.error);
        should.exist(response.guid);
        personGuid = response.guid;
        done();
      });
    });

    it('succeeds (enqueues a person_created event)', function(done){
      api.resque.queue.timestamps(function(error, length){
        should.not.exist(error);
        var latestTimetamp = length[0];
        latestTimetamp.should.be.above(new Date().getTime());
        api.tasks.delayedAt(latestTimetamp, function(error, queued){
          should.not.exist(error);
          var job = queued[0];
          job.args[0].guid.should.equal(personGuid);
          done();
        });
      });
    });

    it('succeeds (can run people:buildCreateEvent)', function(done){
      api.specHelper.runTask('people:buildCreateEvent', {
        teamId: team.id,
        guid: personGuid
      }, function(error){
        specHelper.requestWithLogin(email, password, 'events:search', {
          searchKeys: ['personGuid'],
          searchValues: [personGuid],
          form: 0,
          size: 999,
        }, function(response){
          should.not.exist(response.error);
          response.total.should.equal(1);
          response.events[0].type.should.equal('person_created');
          response.events[0].ip.should.equal('internal');
          done();
        });
      });
    });

    it('fails (uniqueness failure)', function(done){
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        sync: true,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake',
        },
      }, function(response){
        response.error.should.equal('Error: uniqueFields:data.email uniqueness violated via #' + personGuid);
        done();
      });
    });

    it('fails (missing param)', function(done){
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        sync: true,
        data: {},
      }, function(response){
        response.error.should.equal('Error: source is a required parameter for this action');
        done();
      });
    });
  });

  describe('person:view', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('person:view', {
        teamId: team.id,
        guid: personGuid,
      }, function(response){
        should.not.exist(response.error);
        response.person.device.should.equal('unknown');
        response.person.data.email.should.equal('fake@faker.fake');
        done();
      });
    });

    it('succeeds (lists included)', function(done){
      api.models.listPerson.create({
        teamId:     team.id,
        listId:     list.id,
        personGuid: personGuid,
      }).then(function(){

        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid,
        }, function(response){
          should.not.exist(response.error);
          response.lists.length.should.equal(1);
          response.lists[0].name.should.equal('my list');
          done();
        });

      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('person:view', {
        teamId: team.id,
        guid: 'xxx',
      }, function(response){
        response.error.should.equal('Error: person (xxx) not found');
        done();
      });
    });
  });

  describe('person:edit', function(){
    it('succeeds', function(done){
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {email: 'newEmail@faker.fake'}
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('fails (uniqueness failure)', function(done){
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {email: 'otherPerson@faker.fake'}
      }, function(response){
        response.error.should.equal('Error: uniqueFields:data.email uniqueness violated via #' + otherPerson.data.guid);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: 'xxx',
        data: {email: 'otherPerson@faker.fake'}
      }, function(response){
        response.error.should.equal('Error: person (xxx) not found');
        done();
      });
    });
  });

  describe('people:search', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'people:search', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
        form: 1,
        size: 1,
      }, function(response){
        should.not.exist(response.error);
        response.total.should.equal(2);
        response.people.length.should.equal(1);
        done();
      });
    });

    it('fails (not logged in)', function(done){
      api.specHelper.runAction('people:search', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
      }, function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });
  });

  describe('people:aggregation', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
        interval: 'day',
      }, function(response){
        should.not.exist(response.error);
        Object.keys(response.aggregations).length.should.equal(2);
        response.aggregations.tester[0].doc_count.should.equal(2);
        response.selections.should.deepEqual(['tester']);
        response.selectionsName.should.equal('sources');
        done();
      });
    });

    it('fails (not logged in)', function(done){
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
        interval: 'day',
      }, function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });
  });

  describe('person:delete', function(){
    var event;
    var message;

    before(function(done){
      event = new api.models.event(team);
      event.data.messageGuid = Math.random();
      event.data.personGuid = personGuid;
      event.data.type = 'boughtTheThing';
      event.data.ip = '0.0.0.0';
      event.data.device = 'phone';
      event.create(done);
    });

    before(function(done){
      message = new api.models.message(team);
      message.data.personGuid = personGuid;
      message.data.transport  = 'smtp';
      message.data.campaignId = '1';
      message.data.body       = '';
      message.data.view       = {};
      message.data.sentAt     = new Date();
      message.create(done);
    });

    it('succeeds', function(done){
      api.specHelper.runAction('person:delete', {
        teamId: team.id,
        guid: personGuid,
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('succeeds (deletes related listPeople, messages, and events)', function(done){
      var jobs = [];

      jobs.push(function(next){
        var checkMessage = new api.models.message(team, message.data.guid);
        checkMessage.hydrate(function(error){
          String(error).should.equal('Error: message (' + message.data.guid + ') not found');
          next();
        });
      });

      jobs.push(function(next){
        var checkEvent = new api.models.event(team, event.data.guid);
        checkEvent.hydrate(function(error){
          String(error).should.equal('Error: event (' + event.data.guid + ') not found');
          next();
        });
      });

      jobs.push(function(done){
        api.models.listPerson.count({where:{ teamId: team.id, personGuid: personGuid}}).then(function(count){
          count.should.equal(0);
          done();
        });
      });

      async.series(jobs, function(error){
        should.not.exist(error);
        done();
      });
    });

    it('fails (not found)', function(done){
      api.specHelper.runAction('person:delete', {
        teamId: team.id,
        guid: personGuid,
      }, function(response){
        response.error.should.equal('Error: person (' + personGuid + ') not found');
        done();
      });
    });
  });

});
