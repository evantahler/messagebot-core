var async  = require('async');
var qs     = require('qs');

module.exports = {
  startPriority: 9999,

  initialize: function(api, next){
    /* --- Teams --- */
    api.teams = {
      teams: [],
      timer: null,
    };

    /* --- Transports --- */
    api.transports = [];

    /* --- Params Middleware --- */
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

    api.actions.addMiddleware(middleware['data-preperation']);

    /* --- Utils --- */
    api.utils.findInBatches = function(model, query, recordResponder, callback, limit, offset){
      if(!limit){ limit = 1000; }
      if(!offset){ offset = 0; }

      query.limit = limit;
      query.offset = offset;
      model.findAll(query).then(function(records){
        var jobs = [];
        if(!records || records.length === 0){ return callback(); }
        records.forEach(function(r){
          jobs.push(function(done){ recordResponder(r, done); });
        });

        async.series(jobs, function(error){
          if(error){ return error(error); }
          api.utils.findInBatches(model, query, recordResponder, callback, limit, (offset + limit));
        });
      }).catch(callback);
    };

    next();
  },

  start: function(api, next){
    var jobs = [];

    var loadTeams = function(){
      clearTimeout(api.teams.timer);
      api.models.team.findAll().then(function(teams){
        api.teams.teams = teams;
        api.log('loaded ' + teams.length + ' teams into memory');
        api.teams.timer = setTimeout(loadTeams, (60 * 1000));
      });
    };

    // load in the teams list periodically to have the latest list of regexp URL matches
    jobs.push(function(done){
      loadTeams();
      done();
    });

    // ensure the first team existsjobs.push(function(done){
    jobs.push(function(done){
      api.models.team.count().then(function(count){
        if(count > 0){
          done();
        }else{
          var team = api.models.team.build({
            name: 'MessageBot',
            urlRegexp: '^.*$',
          });

          team.save().then(function(){
            api.log('*** created first team called `' + team.name + '` ***', 'alert');
            done();
          }).catch(function(error){
            api.log(error, 'error');
            done(error);
          });
        }
      }).catch(done);
    });

    // ensure that the first admin user exists
    jobs.push(function(done){
      api.models.team.findAll().then(function(teams){
        var team = teams[0];
        api.models.user.count({where: {status: 'admin'}}).then(function(count){
          if(count > 0){
            done();
          }else{
            var user = api.models.user.build({
              teamId:     team.id,
              email:      'admin@localhost.com',
              status:     'admin',
              firstName:  'admin',
              lastName:   'admin',
              personGuid: '0',
            });

            user.updatePassword('password', function(error){
              if(error){ return done(error); }
              user.save().then(function(){
                api.log('*** created first admin user `admin@localhost.com` with password `password` on team `' +  team.name + '` ***', 'alert');
                done();
              }).catch(function(error){
                api.log(error, 'error');
                done(error);
              });
            });
          }
        }).catch(done);
      });
    });

    async.series(jobs, next);
  }
};
