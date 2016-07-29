var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var api;

describe('integartion:binary', function(){
  var team;
  var user;

  before(function(){ api = specHelper.api; });

  it('chooses #help as the default method', function(done){
    this.timeout(10 * 1000);
    var command = './bin/messagebot';
    api.utils.doBash(command, function(error, data){
      should.not.exist(error);
      data.should.containEql('help:');
      done();
    }, true);
  });

  it('returns an error when the method called cannot be found', function(done){
    this.timeout(10 * 1000);
    var command = './bin/messagebot xxx';
    api.utils.doBash(command, function(error, data){
      error.message.should.containEql('Error: `xxx` is not a method I can perform');
      done();
    }, true);
  });

  describe('#help', function(){
    it('returns the help file', function(done){
      this.timeout(10 * 1000);
      var command = './bin/messagebot help';
      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        data.should.containEql('help:');
        data.should.containEql('Learn more @ http://www.messagebot.io');
        done();
      }, true);
    });

    it('returns the version number and name', function(done){
      this.timeout(10 * 1000);
      var pkg = require(__dirname + '/../../package.json');
      var command = './bin/messagebot help';
      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        data.should.containEql('Name: messagebot-core');
        data.should.containEql('Version: ' + pkg.version);
        done();
      }, true);
    });
  });

  describe('#version', function(){
    it('returns the help file', function(done){
      this.timeout(10 * 1000);
      var pkg = require(__dirname + '/../../package.json');
      var command = './bin/messagebot version';
      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        data.should.containEql('Name: messagebot-core');
        data.should.containEql('Version: ' + pkg.version);
        data.should.not.containEql('Learn more @ http://www.messagebot.io');
        done();
      }, true);
    });
  });

  describe('#teamCreate', function(){
    it('succeeds', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamCreate';
      command += ' --name AnotherTestTeam';
      command += ' --trackingDomainRegexp "^.*.app.com$"';
      command += ' --trackingDomain "http://tracking.app.com"';
      command += ' --email "admin@app.com"';
      command += ' --password "password"';

      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        data.should.containEql('New Team');
        data.should.containEql('New User');
        done();
      }, true);
    });

    it('succeeds (creating the team)', function(done){
      api.models.team.findOne({where: {name: 'AnotherTestTeam'}}).then(function(_team){
        _team.trackingDomain.should.equal('http://tracking.app.com');
        team = _team;
        done();
      });
    });

    it('succeeds (creating the user)', function(done){
      api.models.user.findOne({where: {teamId: team.id}}).then(function(_user){
        _user.email.should.equal('admin@app.com');
        user = _user;
        done();
      });
    });

    it('succeeds (creating the person)', function(done){
      var person = new api.models.person(team, user.personGuid);
      person.hydrate(function(error){
        should.not.exist(error);
        person.data.data.email.should.equal('admin@app.com');
        done();
      });
    });

    it('fails (missing params)', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamCreate';
      command += ' --name AnotherTestTeam';
      command += ' --trackingDomain "http://tracking.app.com"';
      command += ' --email "admin@app.com"';
      command += ' --password "password"';

      api.utils.doBash(command, function(error, data){
        error.message.should.containEql('Missing required arguments: trackingDomainRegexp');
        done();
      }, true);
    });

    it('fails (uniqueness)', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamCreate';
      command += ' --name AnotherTestTeam';
      command += ' --trackingDomainRegexp "^.*.app.com$"';
      command += ' --trackingDomain "http://tracking.app.com"';
      command += ' --email "admin@app.com"';
      command += ' --password "password"';

      api.utils.doBash(command, function(error, data){
        error.message.should.containEql('Validation error');
        done();
      }, true);
    });
  });

  describe('#teamEdit', function(){
    it('succeeds', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamEdit';
      command += ' --id ' + team.id;
      command += ' --name AnotherTestTeamNewName';

      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        data.should.containEql('AnotherTestTeamNewName');
        data.should.containEql('http://tracking.app.com');
        done();
      }, true);
    });

    it('fails (uniqueness)', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamEdit';
      command += ' --id ' + team.id;
      command += ' --name TestTeam';

      api.utils.doBash(command, function(error, data){
        error.message.should.containEql('Validation error');
        done();
      }, true);
    });
  });

  describe('#teamsView', function(){
    it('succeeds', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamsList';

      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        data.should.containEql('2 Total Teams');
        data.should.containEql('TestTeam');
        data.should.containEql('AnotherTestTeamNewName');
        done();
      }, true);
    });
  });

  describe('#teamDelete', function(){
    it('succeeds', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamDelete';
      command += ' --id ' + team.id;

      api.utils.doBash(command, function(error, data){
        should.not.exist(error);
        done();
      }, true);
    });

    it('succeeds (deletes the team)', function(done){
      api.models.team.findOne({where: {id: team.id}}).then(function(_team){
        should.not.exist(_team);
        done();
      }).catch(done);
    });

    it('succeeds (deletes the user)', function(done){
      api.models.user.findOne({where: {teamId: team.id}}).then(function(_user){
        should.not.exist(_user);
        done();
      }).catch(done);
    });

    it('succeeds (deletes the person)', function(done){
      var _person = new api.models.person(team, user.personGuid);
      _person.hydrate(function(error){
        String(error).should.equal('Error: person (' + user.personGuid + ') not found');
        done();
      });
    });

    it('fails (missing team)', function(done){
      this.timeout(10 * 1000);
      var command = '';
      command += ' NODE_ENV=test';
      command += ' ./bin/messagebot teamDelete';
      command += ' --id ' + team.id;

      api.utils.doBash(command, function(error, data){
        error.message.should.containEql('Team not found');
        done();
      }, true);
    });
  });

});
