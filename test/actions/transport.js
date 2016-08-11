var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;

describe('system:transports', function(){
  beforeEach(function(){ api = specHelper.api; });

  var firstNumber = null;
  it('falis (not logged in)', function(done){
    api.specHelper.runAction('transports:list', function(response){
      response.error.should.equal('Error: Please log in to continue');
      done();
    });
  });

  it('returns node status', function(done){
    specHelper.requestWithLogin(email, password, 'transports:list', {}, function(response){
      Object.keys(response.transports).length.should.be.above(0);
      response.transports.smtp.name.should.equal('smtp');
      response.transports.smtp.requiredDataKeys.should.deepEqual({ person: ['email'] });
      response.transports.smtp.campaignVariables.should.deepEqual(['from', 'subject']);
      done();
    });
  });

});
