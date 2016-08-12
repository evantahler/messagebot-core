var should     = require('should');
var dateformat = require('dateformat');
var async      = require('async');
var specHelper = require(__dirname + '/../../specHelper');
var api;
var team;

describe('integartion:campaigns', function(){
  this.timeout(10 * 1000);
  before(function(){ api = specHelper.api; });

  before(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  describe('#stats', function(){
    var campaign;
    var messages = [];

    before(function(done){
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

    before(function(done){
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

    after(function(done){ campaign.destroy().then(function(){ done(); }); });
    after(function(done){
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

    before(function(done){
      template = api.models.template.build({
        teamId:      1,
        name:        'my template',
        description: 'my template',
        folder:      'default',
        template:    'Hello there, {{ person.data.firstName }}'
      });

      template.save().then(function(){ done(); });
    });

    before(function(done){
      listPerson = api.models.listPerson.build({
        teamId:     1,
        listId:     list.id,
        personGuid: person.data.guid,
      });

      listPerson.save().then(function(){ done(); });
    });

    before(function(done){
      api.config.tasks.scheduler = true;
      api.resque.startScheduler(done);
    });
    before(function(done){
      api.config.tasks.minTaskProcessors = 1;
      api.config.tasks.maxTaskProcessors = 1;
      api.resque.startMultiWorker(done);
    });
    before(function(done){ setTimeout(done, 3000); }); // to allow time for the scheduler to become master

    after(function(done){
      api.config.tasks.scheduler = false;
      api.resque.stopScheduler(done);
    });
    after(function(done){
      api.config.tasks.minTaskProcessors = 0;
      api.config.tasks.maxTaskProcessors = 0;
      api.resque.stopMultiWorker(done);
    });

    after(function(done){ person.del(done); });
    after(function(done){ template.destroy().then(function(){ done(); }); });
    after(function(done){ list.destroy().then(function(){ done(); }); });
    after(function(done){ listPerson.destroy().then(function(){ done(); }); });

    describe('send#simple', function(){

      before(function(done){
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

      after(function(done){ campaign.destroy().then(function(){ done(); }); });

      it('sends (success)', function(done){
        var jobs = [];

        jobs.push(function(next){
          campaign.send(next);
        });

        jobs.push(function(next){ setTimeout(next, 1000 * 2); });

        async.series(jobs, function(error){
          should.not.exist(error);
          var alias = api.utils.buildAlias(team, 'messages');
          api.elasticsearch.search(alias, ['campaignId'], [campaign.id], 0, 10, null, 1, function(error, results, total){
            should.not.exist(error);
            results.length.should.equal(1);
            results[0].body.should.equal('Hello there, fname');
            done();
          });
        });
      });

      it('sends (failure; double-send)', function(done){
        var jobs = [];

        jobs.push(function(next){
          campaign.send(next);
        });

        async.series(jobs, function(error){
          error.toString().should.equal('Error: campaign already sent');
          done();
        });
      });

    });

    describe('send#recurring', function(){

      before(function(done){
        campaign = api.models.campaign.build({
          teamId:      1,
          name:        'my campaign',
          description: 'my campaign',
          type:        'recurring',
          reSendDelay: 1,
          folder:      'default',
          transport:   'smtp',
          listId:      list.id,
          templateId:  template.id,
        });

        campaign.save().then(function(){ done(); });
      });

      after(function(done){ campaign.destroy().then(function(){ done(); }); });

      it('sends (success; first time)', function(done){
        var jobs = [];

        jobs.push(function(next){
          campaign.send(next);
        });

        jobs.push(function(next){ setTimeout(next, 1000 * 5); });

        async.series(jobs, function(error){
          should.not.exist(error);
          var alias = api.utils.buildAlias(team, 'messages');
          api.elasticsearch.search(alias, ['campaignId'], [campaign.id], 0, 10, null, 1, function(error, results, total){
            should.not.exist(error);
            results.length.should.equal(1);
            results[0].body.should.equal('Hello there, fname');
            done();
          });
        });
      });

      it('sleeps for reSendDelay', function(done){
        setTimeout(done, 1000);
      });

      it('sends (success; second time)', function(done){
        var jobs = [];

        jobs.push(function(next){
          campaign.send(next);
        });

        jobs.push(function(next){ setTimeout(next, 1000 * 5); });

        async.series(jobs, function(error){
          should.not.exist(error);
          var alias = api.utils.buildAlias(team, 'messages');
          api.elasticsearch.search(alias, ['campaignId'], [campaign.id], 0, 10, null, 1, function(error, results, total){
            should.not.exist(error);
            results[0].body.should.equal('Hello there, fname');
            results[1].body.should.equal('Hello there, fname');
            results[0].guid.should.not.equal(results[1].guid);
            results[0].personGuid.should.equal(results[1].personGuid);
            done();
          });
        });
      });

      it('sends (failure; sending too soon)', function(done){
        var jobs = [];

        jobs.push(function(next){
          campaign.updateAttributes({reSendDelay: 9999}).then(function(){
            next();
          }).catch(next);
        });

        jobs.push(function(next){
          campaign.send(next);
        });

        async.series(jobs, function(error){
          error.toString().should.equal('Error: campaign should not be sent yet');
          done();
        });
      });

    });

    describe('send#trigger', function(){

      before(function(done){
        campaign = api.models.campaign.build({
          teamId:      1,
          name:        'my campaign',
          description: 'my campaign',
          type:        'trigger',
          folder:      'default',
          transport:   'smtp',
          listId:      list.id,
          templateId:  template.id,
          triggerDelay: 10,
          triggerEventMatch: {'type': 'person_created'},
        });

        campaign.save().then(function(){ done(); });
      });

      after(function(done){ campaign.destroy().then(function(){ done(); }); });

      it('sends (failure; not how it is done)', function(done){
        var jobs = [];

        jobs.push(function(next){
          campaign.send(next);
        });

        async.series(jobs, function(error){
          error.toString().should.equal('Error: Triggered Campaigns are not sent via this method');
          done();
        });
      });

    });

    describe('triggered messages', function(){
      before(function(done){
        campaign = api.models.campaign.build({
          teamId:      1,
          name:        'my campaign',
          description: 'my campaign',
          type:        'trigger',
          folder:      'default',
          transport:   'smtp',
          listId:      list.id,
          templateId:  template.id,
          triggerDelay: 1,
          triggerEventMatch: {'type': 'pageView', data:{'page': 'myPage'}},
        });

        campaign.save().then(function(){ done(); });
      });

      after(function(done){ campaign.destroy().then(function(){ done(); }); });

      it('sends (success)', function(done){
        var jobs = [];

        jobs.push(function(next){
          api.specHelper.runAction('event:create', {
            teamId: team.id,
            sync: true,
            device: 'tester',
            type: 'pageView',
            page: 'myPage',
            personGuid: person.data.guid,
            data: {page: 'myPage'},
          }, function(result){
            should.not.exist(result.error);
            next();
          });
        });

        // sleep for the trigger delay
        jobs.push(function(next){ setTimeout(next, 1000 * 5); });

        async.series(jobs, function(error){
          should.not.exist(error);
          var alias = api.utils.buildAlias(team, 'messages');
          api.elasticsearch.search(alias, ['campaignId'], [campaign.id], 0, 10, null, 1, function(error, results, total){
            should.not.exist(error);
            results.length.should.equal(1);
            results[0].body.should.equal('Hello there, fname');
            done();
          });
        });
      });

      it('will not send for other events', function(done){
        var jobs = [];

        jobs.push(function(next){
          api.specHelper.runAction('event:create', {
            teamId: team.id,
            sync: true,
            device: 'tester',
            type: 'pageView',
            page: 'myPage',
            personGuid: person.data.guid,
            data: {page: 'otherPage'},
          }, function(result){
            should.not.exist(result.error);
            next();
          });
        });

        // sleep for the trigger delay
        jobs.push(function(next){ setTimeout(next, 1000 * 5); });

        async.series(jobs, function(error){
          should.not.exist(error);
          var alias = api.utils.buildAlias(team, 'messages');
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

});
