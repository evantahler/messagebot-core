var should     = require('should');
var async      = require('async');
var specHelper = require(__dirname + '/../specHelper');
var api;

describe('actions:session', function(){
  beforeEach(function(){ api = specHelper.api; });

  it('can login (happy)', function(done){
    api.specHelper.runAction('session:create', {
      email: 'admin@localhost.com',
      password: 'password'
    }, function(response){
      should.not.exist(response.error);
      response.success.should.equal(true);
      response.user.id.should.equal(1);
      response.user.email.should.equal('admin@localhost.com');
      done();
    });
  });

  it('can login (sad)', function(done){
    api.specHelper.runAction('session:create', {
      email: 'admin@localhost.com',
      password: 'xxx'
    }, function(response){
      response.error.should.equal('Error: password does not match');
      response.success.should.equal(false);
      done();
    });
  });

  it('when logging in, a session object is created in redis', function(done){
    api.specHelper.runAction('session:create', {
      email: 'admin@localhost.com',
      password: 'password'
    }, function(response){
      should.not.exist(response.error);
      var key = api.session.prefix + response.requesterInformation.id;
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
    specHelper.requestWithLogin('admin@localhost.com', 'password', 'user:view', {}, function(response){
      should.not.exist(response.error);
      done();
    });
  });

  it('actions can require a logged-in user (bad auth)', function(done){
    specHelper.requestWithLogin('admin@localhost.com', 'password', 'user:view', {}, function(response){
      should.not.exist(response.error);
      done();
    });
  });

  it('actions can require a logged-in user (missing auth)', function(done){
    api.specHelper.runAction('user:view', {}, function(response){
      response.error.should.equal('Error: Please log in to continue');
      done();
    });
  });

  it('logging out will delete the seession', function(done){
    var jobs = [];
    var connection = new api.specHelper.connection();

    jobs.push(function(next){
      connection.params = {email: 'admin@localhost.com', password: 'password'};
      api.specHelper.runAction('session:create', connection, function(response){
        next(response.error);
      });
    });

    jobs.push(function(next){
      api.specHelper.runAction('user:view', connection, function(response){
        next(response.error);
      });
    });

    jobs.push(function(next){
      api.specHelper.runAction('session:delete', connection, function(response){
        next(response.error);
      });
    });

    jobs.push(function(next){
      api.specHelper.runAction('user:view', connection, function(response){
        response.error.should.equal('Error: Please log in to continue');
        next();
      });
    });

    async.series(jobs, done);
  });

});
