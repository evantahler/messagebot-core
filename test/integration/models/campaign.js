var should     = require('should');
var dateformat = require('dateformat');
var async      = require('async');
var specHelper = require(__dirname + '/../../specHelper');
var api;
var team;

describe('integartion:campaigns', function(){
  beforeEach(function(){ api = specHelper.api; });

  beforeEach(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  describe('#stats', function(){
    var campaign;
    var messages = [];

    beforeEach(function(done){
      campaign = api.models.campaign.build({
        teamId:      1,
        name:        'my campaign',
        description: 'my campaign',
        type:        'simple',
        folder:      'default',
        transport:   'smtp',
        listId:      1,
        templateId:  1,
      });

      campaign.save().then(function(){ done(); });
    });

    beforeEach(function(done){
      var jobs = [];

      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function(i){
        jobs.push(function(next){
          var message = new api.models.message(team);

          message.data.personGuid = Math.random();
          message.data.transport  = 'smtp';
          message.data.campaignId = campaign.id;
          message.data.body       = 'hello';
          message.data.view       = {};
          message.data.sentAt     = new Date();

          messages.push(message);
          message.create(next);
        });
      });

      [0, 1, 2, 3, 4].forEach(function(i){
        jobs.push(function(next){
          var message = messages[i];
          message.data.readAt = new Date();
          message.edit(next);
        });
      });

      [0, 1].forEach(function(i){
        jobs.push(function(next){
          var message = messages[i];
          message.data.actedAt = new Date();
          message.edit(next);
        });
      });

      async.series(jobs, done);
    });

    afterEach(function(done){ campaign.destroy().then(function(){ done(); }); });
    afterEach(function(done){
      var jobs = [];
      messages.forEach(function(message){
        jobs.push(function(next){ message.del(next); });
      });

      async.parallel(jobs, done);
    });

    it('returns valid stats', function(done){
      campaign.stats(new Date(0), new Date(), 'year', function(error, terms, buckets){
        buckets.sentAt.should.equal(10);
        buckets.readAt.should.equal(5);
        buckets.actedAt.should.equal(2);

        var now = new Date();
        terms.sentAt[0].key_as_string.should.equal(dateformat(now, 'yyyy'));
        terms.readAt[0].key_as_string.should.equal(dateformat(now, 'yyyy'));
        terms.actedAt[0].key_as_string.should.equal(dateformat(now, 'yyyy'));

        terms.sentAt[0].doc_count.should.equal(10);
        terms.readAt[0].doc_count.should.equal(5);
        terms.actedAt[0].doc_count.should.equal(2);

        done();
      });
    });
  });

  describe('#send', function(){
    var campaign;
    var person;
    var list;
    var listPerson;
    var template;

    beforeEach(function(done){
      person = new api.models.person(team);
      person.data.source = 'tester';
      person.data.device = 'phone';
      person.data.location = [0, 0];
      person.data.data = {
        firstName: 'fname',
        lastName: 'lame',
        email: 'fake@faker.fake',
      };

      person.create(done);
    });

    beforeEach(function(done){
      list = api.models.list.build({
        teamId:      1,
        name:        'my list',
        type:        'static',
        folder:      'default'
      });

      list.save().then(function(){ done(); });
    });

    beforeEach(function(done){
      template = api.models.template.build({
        teamId:      1,
        name:        'my template',
        description: 'my template',
        folder:      'default',
        template:    'Hello there, {{ person.data.firstName }}'
      });

      template.save().then(function(){ done(); });
    });

    beforeEach(function(done){
      campaign = api.models.campaign.build({
        teamId:      1,
        name:        'my campaign',
        description: 'my campaign',
        type:        'simple',
        folder:      'default',
        transport:   'smtp',
        listId:      list.id,
        templateId:  template.id,
      });

      campaign.save().then(function(){ done(); });
    });

    beforeEach(function(done){
      listPerson = api.models.listPerson.build({
        teamId:     1,
        listId:     list.id,
        personGuid: person.data.guid,
      });

      listPerson.save().then(function(){ done(); });
    });

    afterEach(function(done){ person.del(done); });
    afterEach(function(done){ campaign.destroy().then(function(){ done(); }); });
    afterEach(function(done){ template.destroy().then(function(){ done(); }); });
    afterEach(function(done){ list.destroy().then(function(){ done(); }); });
    afterEach(function(done){ listPerson.destroy().then(function(){ done(); }); });

    it('#send (creating messages)', function(done){
      var testName = this.test.fullTitle();
      var jobs = [];

      jobs.push(function(next){
        campaign.send(next);
      });

      jobs.push(function(next){
        api.specHelper.runTask('campaigns:sendMessage', {
          listId: list.id,
          campaignId: campaign.id,
          personGuid: listPerson.personGuid,
        }, next);
      });

      async.series(jobs, function(error){
        should.not.exist(error);
        var alias = api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'messages';
        api.elasticsearch.search(alias, ['campaignId'], [campaign.id], 0, 10, null, 1, function(error, results, total){
          should.not.exist(error);
          results.length.should.equal(1);
          results[0].body.should.equal('Hello there, fname');
          done();
        });
      });
    });
  });

});
