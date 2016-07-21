var should     = require('should');
var request    = require('request');
var specHelper = require(__dirname + '/../specHelper');
var route      = '/api/session';
var api;
var url;

describe('actions:session', function(){
  beforeEach(function(){
    api = specHelper.api;
    url = 'http://' + api.config.servers.web.bindIP + ':' + api.config.servers.web.port + route;
  });

  it('can login (happy)', function(done){
    request.post(url, {form: { email: 'admin@localhost.com', password: 'password' }}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.success.should.equal(true);
      body.user.id.should.equal(1);
      body.user.email.should.equal('admin@localhost.com');
      done();
    });
  });

  it('can login (sad)', function(done){
    request.post(url, {form: { email: 'admin@localhost.com', password: 'xxx' }}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.success.should.equal(false);
      done();
    });
  });

  it('when logging in, a session object is created in redis', function(done){
    request.post(url, {form: { email: 'admin@localhost.com', password: 'password' }}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      var key = api.session.prefix + body.requesterInformation.fingerprint;
      api.redis.clients.client.get(key, function(error, data){
        should.not.exist(error);
        data = JSON.parse(data);
        data.userId.should.equal(1);
        data.role.should.equal('admin');
        api.redis.clients.client.ttl(key, function(error, ttl){
          should.not.exist(error);
          ttl.should.be.within((api.session.ttl - 5000), (api.session.ttl));
          done();
        });
      });
    });
  });

  it('actions can require a logged-in user (success)', function(done){
    specHelper.requestWithLogin('admin@localhost.com', 'password', '/api/user', 'get', {}, function(error, data){
      should.not.exist(error);
      should.not.exist(data.error);
      done();
    });
  });

  it('actions can require a logged-in user (failure)', function(done){
    request.get('http://localhost:18080/api/user', {}, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.error.should.equal('Please log in to continue');
      done();
    });
  });

});
