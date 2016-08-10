var should     = require('should');
var fs         = require('fs');
var specHelper = require(__dirname + '/../specHelper');
var api;
var MESSAGEBOT;

describe('general:applicaiton', function(){
  beforeEach(function(){ api = specHelper.api; });

  it('can boot', function(done){
    api.running.should.equal(true);
    api.transports.length.should.be.above(0);
    done();
  });

  describe('navigation', function(done){
    beforeEach(function(){ MESSAGEBOT = {}; });

    it('will generate the routes file', function(done){
      var content = fs.readFileSync(api.projectRoot + '/public/js/routes.js').toString();
      var lines = content.split('\r\n');
      lines.shift();
      lines.forEach(function(line){ eval(line); });
      should.exist(MESSAGEBOT);
      MESSAGEBOT.routes.length.should.be.above(0);
      MESSAGEBOT.routes.forEach(function(r){
        should.exist(r.route);
        should.exist(r.page);
        should.exist(r.title);
        should.exist(r.auth);
      });

      done();
    });

    it('will generate the naviation file', function(done){
      var content = fs.readFileSync(api.projectRoot + '/public/js/navigation.js').toString();
      var lines = content.split('\r\n');
      lines.shift();
      lines.forEach(function(line){ eval(line); });
      should.exist(MESSAGEBOT);
      MESSAGEBOT.navigation.length.should.be.above(0);
      done();
    });
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
  });

});
