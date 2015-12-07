var async = require('async');

module.exports = {
  startPriority: 9999,

  initialize: function(api, next){

    var middleware = {
      // These actions are restricted to the website (and you need a CSRF token)
      'data-preperation': {
        name: 'data-preperation',
        global: true,
        priority: 1,
        preProcessor: function(data, callback){

          if(data.params.searchKeys){
            if(typeof data.params.searchKeys === 'string'){
              data.params.searchKeys = data.params.searchKeys.split(',');
            }
          }

          if(data.params.searchValues){
            if(typeof data.params.searchValues === 'string'){
              data.params.searchValues = data.params.searchValues.split(',');
            }
          }

          if(data.params.permissions){
            if(typeof data.params.permissions === 'string'){
              data.params.permissions = data.params.permissions.split(',');
            }
          }
          
          if(data.params.data && typeof data.params.data === 'string'){
            try{
              data.params.data = JSON.parse(data.params.data);
            }catch(e){
              return callback('cannot parse `data`. Are you sure that it is JSON?');
            }
          }

          return callback();
        }
      }
    };

    api.actions.addMiddleware( middleware['data-preperation'] );

    next();
  },

  start: function(api, next){
   var jobs = [];

   // ensure that the first admin user exists
   jobs.push(function(done){
    api.models.user.count({where: {status: 'admin'}}).then(function(count){
      if(count > 0){
        done(); 
      }else{
        var user = api.models.user.build({
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