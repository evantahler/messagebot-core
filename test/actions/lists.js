var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;
var listId;
var team;

describe('actions:lists', function(){
  beforeEach(function(){ api = specHelper.api; });

  beforeEach(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  before(function(done){ specHelper.truncate('lists', done); });
  before(function(done){ specHelper.truncate('listPeople', done); });
  after(function(done){ specHelper.truncate('lists', done); });
  after(function(done){ specHelper.truncate('listPeople', done); });

  describe('list:create', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'list:create', {
        name: 'test list',
        description: 'test list',
        type: 'static',
      }, function(response){
        should.not.exist(response.error);
        response.list.folder.should.equal('default');
        response.list.name.should.equal('test list');
        listId = response.list.id;
        done();
      });
    });

    it('fails (uniqueness failure)', function(done){
      specHelper.requestWithLogin(email, password, 'list:create', {
        name: 'test list',
        description: 'test list',
        type: 'static',
      }, function(response){
        response.error.should.match(/must be unique/);
        done();
      });
    });

    it('fails (missing param)', function(done){
      specHelper.requestWithLogin(email, password, 'list:create', {
        description: 'test list',
        type: 'static',
      }, function(response){
        response.error.should.equal('Error: name is a required parameter for this action');
        done();
      });
    });
  });

  describe('list:view', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'list:view', {
        listId: listId
      }, function(response){
        should.not.exist(response.error);
        response.list.folder.should.equal('default');
        response.list.name.should.equal('test list');
        done();
      });
    });

    it('fails (not found)', function(done){
      specHelper.requestWithLogin(email, password, 'list:view', {
        listId: 999
      }, function(response){
        response.error.should.equal('Error: list not found');
        done();
      });
    });
  });

  describe('list:copy', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'list:copy', {
        listId: listId,
        name: 'new list',
      }, function(response){
        should.not.exist(response.error);
        response.list.id.should.not.equal(listId);
        response.list.folder.should.equal('default');
        response.list.name.should.equal('new list');
        done();
      });
    });

    it('fails (uniqueness param)', function(done){
      specHelper.requestWithLogin(email, password, 'list:copy', {
        listId: listId,
        name: 'test list',
      }, function(response){
        response.error.should.match(/must be unique/);
        done();
      });
    });

    it('fails (missing param)', function(done){
      specHelper.requestWithLogin(email, password, 'list:copy', {
        listId: listId,
      }, function(response){
        response.error.should.equal('Error: name is a required parameter for this action');
        done();
      });
    });
  });

  describe('list:edit', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'list:edit', {
        listId: listId,
        name: 'a better list name',
      }, function(response){
        should.not.exist(response.error);
        response.list.name.should.equal('a better list name');
        done();
      });
    });

    it('fails (uniqueness failure)', function(done){
      specHelper.requestWithLogin(email, password, 'list:edit', {
        listId: listId,
        name: 'new list',
      }, function(response){
        response.error.should.equal('Error: Validation error');
        done();
      });
    });
  });

  describe('lists:types', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'lists:types', {}, function(response){
        should.not.exist(response.error);
        response.validTypes.should.deepEqual(['dynamic', 'static']);
        done();
      });
    });
  });

  describe('lists:list', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'lists:list', {}, function(response){
        should.not.exist(response.error);
        response.lists.length.should.equal(2);
        response.lists[0].name.should.equal('a better list name');
        response.lists[1].name.should.equal('new list');
        done();
      });
    });
  });

  describe('lists:folders', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'lists:folders', {}, function(response){
        should.not.exist(response.error);
        response.folders.length.should.equal(1);
        response.folders.should.deepEqual(['default']);
        done();
      });
    });
  });

  describe('list:people', function(){
    var dynamicListId;
    var person;
    var csvPeople = [];

    before(function(done){
      specHelper.requestWithLogin(email, password, 'list:create', {
        name: 'dynamic list',
        description: 'dynamic list',
        type: 'dynamic',
      }, function(response){
        should.not.exist(response.error);
        dynamicListId = response.list.id;
        done();
      });
    });

    before(function(done){
      person = new api.models.person(team);
      person.data.source = 'tester';
      person.data.device = 'phone';
      person.data.data = {
        firstName: 'fname',
        lastName: 'lame',
        email: 'fake@faker.fake',
      };

      person.create(done);
    });

    after(function(done){ person.del(done); });
    after(function(done){
      var jobs = [];
      csvPeople.forEach(function(guid){
        jobs.push(function(next){
          var p = new api.models.person(team, guid);
          p.del(next);
        });
      });

      async.series(jobs, done);
    });

    describe('list:people:add', function(){

      it('succeeds with personGuids via Form', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: listId,
          personGuids: person.data.guid
        }, function(response){
          should.not.exist(response.error);
          response.personGuids.length.should.equal(1);
          done();
        });
      });

      it('fails (re-adding an existing person)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: listId,
          personGuids: person.data.guid
        }, function(response){
          response.error.should.equal('Error: Validation error');
          response.personGuids.length.should.equal(0);
          done();
        });
      });

      it('succeeds with people via CSV Upload', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: listId,
          file: {path: __dirname + '/../../samples/email-upload.csv' }
        }, function(response){
          should.not.exist(response.error);
          response.personGuids.length.should.equal(3);
          csvPeople = response.personGuids;
          done();
        });
      });

      it('fails (list is not found)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: 999,
          personGuids: person.data.guid
        }, function(response){
          response.error.should.equal('Error: list not found');
          done();
        });
      });

      it('fails (no people provided)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: listId,
          personGuids: ''
        }, function(response){
          response.error.should.equal('Error: No people are provided');
          done();
        });
      });

      it('fails (list is not static)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: dynamicListId,
          personGuids: person.data.guid
        }, function(response){
          response.error.should.equal('Error: you can only modify static list membership via this method');
          done();
        });
      });
    });

    describe('list:people:delete', function(){
      it('succeeds with personGuids', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:delete', {
          listId: listId,
          personGuids: person.data.guid
        }, function(response){
          should.not.exist(response.error);
          response.deletedListPeople.length.should.equal(1);
          response.deletedListPeople[0].personGuid.should.equal(person.data.guid);
          done();
        });
      });

      it('fails (person not in list)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:delete', {
          listId: listId,
          personGuids: 'abc123'
        }, function(response){
          response.error.should.equal('Error: List Person (guid abc123) not found in this list');
          done();
        });
      });

      it('fails (list is not found)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:delete', {
          listId: 999,
          personGuids: person.data.guid
        }, function(response){
          response.error.should.equal('Error: list not found');
          done();
        });
      });

      it('fails (list is not static)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:add', {
          listId: dynamicListId,
          personGuids: person.data.guid
        }, function(response){
          response.error.should.equal('Error: you can only modify static list membership via this method');
          done();
        });
      });
    });

    describe('list:people:count', function(){
      it('succeeds with personGuids', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:count', {
          listId: listId,
        }, function(response){
          should.not.exist(response.error);
          done();
        });
      });

      it('fails (list is not found)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:count', {
          listId: 999,
        }, function(response){
          response.error.should.equal('Error: list not found');
          done();
        });
      });
    });

    describe('list:people:view', function(){
      it('succeeds with all', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:view', {
          listId: listId,
        }, function(response){
          should.not.exist(response.error);
          response.total.should.equal(3);
          response.people.length.should.equal(3);
          csvPeople.should.containEql(response.people[0].guid);
          csvPeople.should.containEql(response.people[1].guid);
          csvPeople.should.containEql(response.people[2].guid);
          done();
        });
      });

      it('succeeds with from/size', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:view', {
          listId: listId,
          from: 1,
          size: 1
        }, function(response){
          should.not.exist(response.error);
          response.total.should.equal(3);
          response.people.length.should.equal(1);
          csvPeople.should.containEql(response.people[0].guid);
          done();
        });
      });

      it('fails (list is not found)', function(done){
        specHelper.requestWithLogin(email, password, 'list:people:view', {
          listId: 999,
        }, function(response){
          response.error.should.equal('Error: list not found');
          done();
        });
      });
    });
  });

  describe('list:delete', function(){
    it('succeeds', function(done){
      specHelper.requestWithLogin(email, password, 'list:delete', {
        listId: listId,
      }, function(response){
        should.not.exist(response.error);
        done();
      });
    });

    it('fails (not found)', function(done){
      specHelper.requestWithLogin(email, password, 'list:delete', {
        listId: listId,
      }, function(response){
        response.error.should.equal('Error: list not found');
        done();
      });
    });
  });

});
