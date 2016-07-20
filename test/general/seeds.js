var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;

describe('general:seeds', function(){

  before(function(done){
    specHelper.start(function(error, a){
      api = a; done(error);
    });
  });

  after(function(done){ specHelper.stop(done); });

  it('has the first team', function(done){
    api.models.team.findOne({where: {id: 1}}).then(function(team){
      team.id.should.equal(1);
      team.name.should.equal('MessageBot');
      team.trackingDomain.should.equal('https://tracking.site.com');
      team.trackingDomainRegexp.should.equal('^.*$');

      done();
    });
  });

  it('has the first admin user', function(done){
    api.models.user.findOne({where: {id: 1}}).then(function(user){
      user.id.should.equal(1);
      user.teamId.should.equal(1);
      user.email.should.equal('admin@localhost.com');
      user.status.should.equal('admin');

      user.checkPassword('password', function(error, match){
        should.not.exist(error);
        match.should.equal(true);
        done();
      });
    });
  });

});
