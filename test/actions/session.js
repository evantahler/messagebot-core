var should     = require('should');
var request    = require('request');
var specHelper = require(__dirname + '/../specHelper');
var route      = 'http://localhost:18080/api/session';

describe('actions:session', function(){

  before(function(done){ specHelper.startServer(done); });
  after(function(done){  specHelper.stopServer(done);  });

  it('can login (happy)', function(done){
    request.post(route, {form: { email: 'admin@localhost.com', password: 'password' }}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.success.should.equal(true);
      body.user.id.should.equal(1);
      body.user.email.should.equal('admin@localhost.com');
      done();
    });
  });

  it('can login (sad)', function(done){
    request.post(route, {form: { email: 'admin@localhost.com', password: 'xxx' }}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.success.should.equal(false);
      done();
    });
  });

  it('when logging in, a session object is created in redis', function(done){
    request.post(route, {form: { email: 'admin@localhost.com', password: 'password' }}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      var key = specHelper.api.session.prefix + body.requesterInformation.fingerprint;
      specHelper.api.redis.client.get(key, function(error, data){
        should.not.exist(error);
        data = JSON.parse(data);
        data.userId.should.equal(1);
        data.status.should.equal('admin');
        specHelper.api.redis.client.ttl(key, function(error, ttl){
          should.not.exist(error);
          ttl.should.be.within((specHelper.api.session.ttl - 5000), (specHelper.api.session.ttl));
          done();
        });
      });
    });
  });

  it('actions can require a logged-in user', function(done){
    request.del('http://localhost:18080/api/user', {}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.error.should.equal('Please log in to continue');
      done();
    });
  });

});
