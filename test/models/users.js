var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;
var user;

describe('models:users', function(){

  before(function(done){
    specHelper.start(function(error, a){
      api = a; done(error);
    });
  });

  after(function(done){ specHelper.stop(done); });

  afterEach(function(done){
    if(user.isNewRecord === false){
      user.destroy().then(function(){ done(); });
    }else{
      done();
    }
  });

  it('can create new users with valid params', function(done){
    user = api.models.user.build({
      teamId:       1,
      email:        'a@b.com',
      personGuid:   Math.random(),
      passwordHash: 'xxx',
      firstName:    'fname',
      lastName:     'lname',
      status:       'admin',
    });

    user.save().then(function(){
      api.models.user.findOne({where: {email: 'a@b.com'}}).then(function(user){
        user.email.should.equal('a@b.com');
        done();
      });
    });
  });

  it('will not create new users with invalid params (missing requirement)', function(done){
    user = api.models.user.build({
      teamId:       1,
      passwordHash: 'xxx',
      lastName:     'lname',
    });

    user.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(3);
      errors.errors[0].message.should.equal('email cannot be null');
      errors.errors[1].message.should.equal('personGuid cannot be null');
      errors.errors[2].message.should.equal('firstName cannot be null');
      done();
    });
  });

  it('will not create new users with invalid params (duplicate key)', function(done){
    user = api.models.user.build({
      teamId:       1,
      email:        'admin@localhost.com',
      personGuid:   Math.random(),
      passwordHash: 'xxx',
      firstName:    'fname',
      lastName:     'lname',
      status:       'admin',
    });

    user.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(1);
      errors.errors[0].message.should.equal('emailUniqueIndex must be unique');
      done();
    });
  });

  it('will not create new users with invalid params (bad status)', function(done){
    user = api.models.user.build({
      teamId:       1,
      email:        'admin5@localhost.com',
      personGuid:   Math.random(),
      passwordHash: 'xxx',
      firstName:    'fname',
      lastName:     'lname',
      status:       'bacon',
    });

    user.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(1);
      errors.errors[0].message.should.equal('status is invalid');
      done();
    });
  });

  it('passwords can be checked (success)', function(done){
    user = api.models.user.build({
      teamId:     1,
      personGuid: Math.random(),
      email:      'aaa@b.com',
      firstName:  'fname',
      lastName:   'lname',
      status:     'admin',
    });

    user.updatePassword('password', function(error){
      should.not.exist(error);
      user.save().then(function(){
        user.checkPassword('password', function(error, match){
          should.not.exist(error);
          match.should.equal(true);
          done();
        });
      });
    });
  });

  it('passwords can be checked (failure)', function(done){
    user = api.models.user.build({
      teamId:     1,
      personGuid: Math.random(),
      email:      'bbb@b.com',
      firstName:  'fname',
      lastName:   'lname',
      status:     'admin',
    });

    user.updatePassword('password', function(error){
      should.not.exist(error);
      user.save().then(function(){
        user.checkPassword('wrongPassword', function(error, match){
          should.not.exist(error);
          match.should.equal(false);
          done();
        });
      });
    });
  });

});
