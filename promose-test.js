var Sequelize = require('sequelize');
var should    = require('should');
var async     = require('async');

var sequelize = new Sequelize('messagebot_test', 'root', null, {dialect:'mysql'});

var User = sequelize.define('user',
  {
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
  },
  {
    instanceMethods: {
      name: function(callback){
        var self = this;
        var jobs = [];
        var name = '';

        // process.nextTick(function(){
          name += self.firstName + ' ' + self.lastName;
          return callback(null, name);
        // });
      }
    }
  }
);

it('can get name', function(done){
  var jobs = [];
  var user;

  jobs.push(function(next){
    User.findOne().then(function(_user){
      should.exist(_user);
      user = _user;
      console.log('prmoise should be done now');
      next();
    }).catch(function(error){
      console.log('caught error from prommise:', error.toString());
      next(error);
    });
  });

  jobs.push(function(next){
    user.name(function(error, name){
      console.log('error', error);
      console.log('name', name);
      should.not.exist(error);
      name.should.equal('dave smith');
      next();
    });
  });

  async.series(jobs, done);
});
