var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;

describe('general:applicaiton', function(){

  before(function(done){
    specHelper.start(function(error, a){
      api = a; done(error);
    });
  });

  after(function(done){ specHelper.stop(done); });

  it('can boot', function(done){
    api.running.should.equal(true);
    api.transports.length.should.be.above(0);
    done();
  });

  describe('utils', function(){
    it('api.utils.findInBatches', function(done){
      var totalUsers = 0;
      api.utils.findInBatches(api.models.user, {}, function(user, next){
        totalUsers++;
        next();
      }, function(error){
        should.not.exist(error);
        totalUsers.should.be.above(0);
        done();
      });
    });

    it('api.utils.determineActionsTeam', function(done){
      var team;
      api.teams.teams.length.should.equal(1);

      // via ID
      team = api.utils.determineActionsTeam({params: {teamId: 1}});
      should.exist(team);

      team = api.utils.determineActionsTeam({params: {teamId: 99}});
      should.not.exist(team);

      // via session
      team = api.utils.determineActionsTeam({session: {teamId: 1}});
      should.exist(team);

      team = api.utils.determineActionsTeam({session: {teamId: 99}});
      should.not.exist(team);

      // via url
      // TODO

      done();
    });

    it('api.utils.cleanTeamName', function(done){
      api.utils.cleanTeamName('Message Bot').should.equal('messagebot');
      api.utils.cleanTeamName('Message-Bot').should.equal('messagebot');
      api.utils.cleanTeamName('Message_Bot').should.equal('message_bot');

      done();
    });
  });

});
