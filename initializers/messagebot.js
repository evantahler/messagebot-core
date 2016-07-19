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

    /*--- Inject team into Elasticsaerch models ---*/
    api.models.orignalElasticSearch = {};
    ['event', 'person', 'message'].forEach(function(key){
      api.models.orignalElasticSearch[key] = api.models[key];

      api.models[key] = function(team, guid, index, alias){
        var instance = new api.models.orignalElasticSearch[key](guid, index, alias);
        if(!index){ instance.index = api.utils.cleanTeamName(team.name) + '-' + instance.index; }
        if(!alias){ instance.alias = api.utils.cleanTeamName(team.name) + '-' + instance.alias; }
        return instance;
      };
    });


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

    api.utils.determineActionsTeam = function(data){
      var team;

      // leave this as an option for explicit tasks/internal use
      // no action should have this allowed as a param
      if(!team && data.params.teamId){
        api.teams.teams.forEach(function(_team){
          if(_team.id === data.params.teamId){ team = _team; }
        });
      }

      if(!team && data.session && data.session.teamId){
        api.teams.teams.forEach(function(_team){
          if(_team.id === data.session.teamId){ team = _team; }
        });
      }

      if(!team && data.connection && data.connection.type === 'web'){
        api.teams.teams.forEach(function(_team){
          var regexp = new RegExp(_team.urlRegexp);
          if(data.connection.rawConnection.req.headers.host.match(regexp)){ team = _team; }
        });
      }

      return team;
    };

    api.utils.cleanTeamName = function(name){
      name = name.replace(/-/g, '');
      name = name.replace(/\s/g, '');
      name = name.toLowerCase();
      return name;
    };

    next();
  },

  start: function(api, next){
    var jobs = [];

    var loadTeams = function(){
      clearTimeout(api.teams.timer);
      api.models.team.findAll().then(function(teams){
        api.teams.teams = teams;
        api.log('loaded ' + teams.length + ' teams into memory', 'debug');
        api.teams.timer = setTimeout(loadTeams, (60 * 1000));
      });
    };

    // load in the teams list periodically to have the latest list of regexp URL matches
    jobs.push(function(done){
      loadTeams();
      done();
    });

    async.series(jobs, next);
  }
};
