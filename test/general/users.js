var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');

describe('general:users', function(){

  before(function(done){ specHelper.api.sequelize.query('truncate table users', true, done); });
  before(function(done){ specHelper.startServer(done); });
  after(function(done){  specHelper.stopServer(done);  });

  it('the first admin users should be automatically created', function(done){
    specHelper.api.sequelize.query('select * from users', function(error, rows){
      should.not.exist(error);
      rows.length.should.equal(1);
      rows[0].email.should.equal('admin@localhost.com');
      rows[0].status.should.equal('admin');
      done();
    });
  });

  it('can create new users with valid params', function(done){
    var user = specHelper.api.models.user.build({
      email:        'a@b.com',
      passwordHash: 'xxx',
      passwordSalt: 'xxx',
      firstName:    'fname',
      lastName:     'lname',
    });

    user.save().then(function(){
      specHelper.api.models.user.findOne({where: {email: 'a@b.com'}}).then(function(user){
        user.email.should.equal('a@b.com');
        done();
      });
    });
  });

  it('will not create new users with invalid params (missing requirement)', function(done){
    var user = specHelper.api.models.user.build({
      passwordHash: 'xxx',
      passwordSalt: 'xxx',
      lastName:     'lname',
    });

    user.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(2);
      errors.errors[0].message.should.equal('email cannot be null');
      errors.errors[1].message.should.equal('firstName cannot be null');
      done();
    });
  });

  it('will not create new users with invalid params (duplicate key)', function(done){
    var user = specHelper.api.models.user.build({
      email:        'admin@localhost.com',
      passwordHash: 'xxx',
      passwordSalt: 'xxx',
      firstName:    'fname',
      lastName:     'lname',
    });

    user.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(1);
      errors.errors[0].message.should.equal('emailUniqueIndex must be unique');
      done();
    });
  });

  it('passwords can be checked (success)', function(done){
    var user = specHelper.api.models.user.build({
      email:     'aaa@b.com',
      firstName: 'fname',
      lastName:  'lname',
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
    var user = specHelper.api.models.user.build({
      email:     'bbb@b.com',
      firstName: 'fname',
      lastName:  'lname',
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
