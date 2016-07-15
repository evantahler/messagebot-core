var async  = require('async');
var qs     = require('qs');

module.exports = {
  startPriority: 9999,

  initialize: function(api, next){

    api.transports = [];

    var middleware = {
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

          if(data.params.data && typeof data.params.data === 'string'){
            try{
              data.params.data = JSON.parse(data.params.data);
            }catch(e){
              return callback('cannot parse `data`. Are you sure that it is JSON?');
            }
          }

          // Allow for sloppy parsing of the data object in forms
          // IE: `curl -X POST -d 'personGuid=evan&type=pageView&data[page]=index.html' http://localhost:8080/api/event`
          var d;
          for(var key in data.params){
            if(key.indexOf('data[') === 0){
              if(!data.params.data){ data.params.data = {}; }
              d = qs.parse(key + '=' + data.params[key], api.config.servers.web.queryParseOptions);
              for(var newKey in d.data){
                data.params.data[newKey] = d.data[newKey];
              }
              delete data.params[key];
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
          personGuid:  '0',
        });

        user.updatePassword('password', function(error){
          if(error){ return done(error); }
          user.save().then(function(){
            api.log('*** created first admin user `admin@localhost.com` with password `password` ***', 'alert');
            done();
          }).catch(function(error){
            api.log(error, 'error');
            done(error);
          });
        });
      }
    }).catch(done);
   });

   async.series(jobs, next);
  }
};
