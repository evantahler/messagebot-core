var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../../specHelper');
var api;

describe('integartion:campaigns', function(){
  describe('#send', function(done){
    var campaign;
    var person;
    var list;
    var listPerson;
    var template;
    var team;

    beforeEach(function(){ api = specHelper.api; });

    beforeEach(function(done){
      api.models.team.findOne().then(function(_team){
        team = _team;
        done();
      });
    });

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
        type:        'simple',
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
      this.timeout(30 * 1000);
      var testName = this.test.fullTitle();
      var jobs = [];

      jobs.push(function(next){
        specHelper.ensureWrite(testName, next);
      });

      jobs.push(function(next){
        campaign.send(next);
      });

      jobs.push(function(next){
        specHelper.ensureWrite(testName, next);
      });

      async.series(jobs, function(error){
        should.not.exist(error);
        var alias = api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'messages';
        api.elasticsearch.search(api, alias, ['campaignId'], [campaign.id], 0, 10, null, function(error, results, total){
          should.not.exist(error);
          results.length.should.equal(1);
          results[0].body.should.equal('Hello there, fname');
          done();
        });
      });
    });
  });

});
