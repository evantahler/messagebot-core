var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;

describe('system:status', function(){
  beforeEach(function(){ api = specHelper.api; });

  var firstNumber = null;
  it('falis (not logged in)', function(done){
    api.specHelper.runAction('system:status', function(response){
      response.error.should.equal('Error: Please log in to continue');
      done();
    });
  });

  it('returns node status', function(done){
    specHelper.requestWithLogin(email, password, 'system:status', {}, function(response){
      response.database.healthy.should.equal(true);
      ['campaign', 'list', 'listPerson', 'template', 'user'].forEach(function(table){
        should.exist(response.database[table]);
      });

      should.exist(response.elasticsearch.info.name);
      response.elasticsearch.health.status.should.equal('green');

      response.redis.tasks.healthy.should.equal(true);
      response.redis.client.healthy.should.equal(true);

      response.node.id.should.equal('test-server');
      response.node.healthy.should.equal(true);
      response.node.uptime.should.be.above(0);
      response.node.avgEventLoopDelay.should.be.below(1);
      response.node.memoryUsedMB.should.be.below(150);
      response.node.team.id.should.equal(1);
      response.node.team.name.should.equal('TestTeam');

      done();
    });
  });

});
