var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../../specHelper');
var api;
var team;

describe('integartion:settings', function(){
  before(function(){ api = specHelper.api; });

  before(function(done){
    api.models.team.findOne().then(function(_team){
      team = _team;
      done();
    });
  });

  it('seeded the settings for the team at boot', function(done){
    api.models.setting.findAll({where: {teamId: team.id}}).then(function(settings){
      settings.length.should.be.above(0);
      done();
    });
  });
});
