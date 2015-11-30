var async = require('async');

module.exports = {
  startPriority: 9999,

  start: function(api, next){
   var jobs = [];

   // ensure that the first admin user exists
   jobs.push(function(done){
    api.models.user.count({where: {status: 'admin'}}).then(function(count){
      if(count > 0){
        done(); 
      }else{
        user = api.models.user.build({
          email:     'admin@localhost.com',
          status:    'admin',
          firstName: 'admin',
          lastName:  'admin',
        });

        user.updatePassword('password', function(error){
          if(error){ return next(error); }
          user.save().then(function(){
            api.log('*** created first admin user `admin@localhost.com` with password `password` ***', 'alert');
            done();
          }).catch(done);
        });
      }
    }).catch(done);
   });

   async.series(jobs, next);
  }
};