var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;
var team;

describe('models:team', function(){
  beforeEach(function(){ api = specHelper.api; });

  afterEach(function(done){
    if(team.isNewRecord === false){
      team.destroy().then(function(){ done(); });
    }else{
      done();
    }
  });

  it('can create a new team with valid params', function(done){
    team = api.models.team.build({
      name: 'my team',
      trackingDomainRegexp: '^.*.site.com$',
      trackingDomain: 'https://www.site.com',
    });

    team.save().then(function(){
      api.models.team.findOne({where: {trackingDomain: 'https://www.site.com'}}).then(function(team){
        team.name.should.equal('my team');
        team.trackingDomainRegexp.should.equal('^.*.site.com$');
        done();
      });
    });
  });

  it('will not create a new team with invalid params (missing requirement)', function(done){
    team = api.models.team.build({
      name: 'my team',
    });

    team.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(2);
      errors.errors[0].message.should.equal('trackingDomainRegexp cannot be null');
      errors.errors[1].message.should.equal('trackingDomain cannot be null');
      done();
    });
  });

  it('will not create a new team with invalid params (duplicate key)', function(done){
    team = api.models.team.build({
      name: 'my team',
      trackingDomainRegexp: '^.*.site.com$',
      trackingDomain: 'https://www.site.com',
    });

    team.save().then(function(){
      var otherTeam = api.models.team.build({
        name: 'my team',
        trackingDomainRegexp: '^.*.site.com$',
        trackingDomain: 'https://www.site.com',
      });


      otherTeam.save().then(function(){
        throw new Error('should not get here');
      }).catch(function(errors){
        errors.errors.length.should.equal(1);
        errors.errors[0].message.should.equal('teams_name must be unique');
        done();
      });
    });
  });

});
