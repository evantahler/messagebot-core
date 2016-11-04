'use strict';

var fs     = require('fs');
var path   = require('path');
var async  = require('async');

module.exports = {
  loadPriority: 1000,

  initialize: function(api, next){
    api.teams = {
      teams: [],
      settings: [],

      load: function(callback){
        var jobs = [];
        if(api.running){
          api.models.team.findAll().then(function(teams){
            api.teams.teams = teams;

            teams.forEach(function(team){
              jobs.push(function(done){
                api.teams.ensureSettings(team, done);
              });
            });

            // teams.forEach(function(team){
            //   jobs.push(function(done){
            //     api.teams.renderClientTracking(team, done);
            //   });
            // });

            async.series(jobs, function(error){
              process.nextTick(function(){
                if(error){ return callback(error); }
                api.log('loaded ' + teams.length + ' teams into memory');
                return callback();
              });
            });
          });
        }else{
          return callback();
        }
      },

      ensureSettings: function(team, callback){
        var jobs = [];
        api.models.setting.findAll({where: {teamId: team.id}}).then(function(settings){
          api.teams.settings.forEach(function(settingParent){
            var found = false;
            settings.forEach(function(s){
              if(s.key === settingParent.key){ found = true; }
            });

            if(found === false){
              jobs.push(function(done){
                api.models.setting.create({
                  teamId:      team.id,
                  key:         settingParent.key,
                  value:       settingParent.value,
                  description: settingParent.description,
                }).then(function(){
                  api.log(['[Team #%s] set default setting for `%s` to `%s`', team.id, settingParent.key, settingParent.value]);
                  done();
                }).catch(function(error){
                  // another instance created the setting for us; it's OK.
                  if(error.toString().match(/SequelizeUniqueConstraintError/)){
                    return done();
                  }else{
                    return done(error);
                  }
                });
              });
            }
          });

          async.series(jobs, callback);
        }).catch(callback);
      },

      // renderClientTracking: function(team, callback){
      //   var jobs = [];
      //   var settings = [];
      //   var sourceDir = path.normalize([__dirname, '..', 'client'].join(path.sep));
      //   var publicDir = api.config.general.paths.public[0];
      //   var teamDir = path.normalize([publicDir, 'tracking', team.id].join(path.sep));
      //   var dirExists = false;
      //
      //   jobs.push(function(done){
      //     api.models.setting.findAll({where: {teamId: team.id}}).then(function(_settings){
      //       settings = _settings;
      //       done();
      //     }).catch(done);
      //   });
      //
      //   jobs.push(function(done){
      //     fs.lstat(teamDir, function(error, stats){
      //       if(error && !error.toString().match(/ENOENT/)){ return done(error); }
      //       if(error && error.toString().match(/EEXIST/)){ dirExists = true; }
      //       if(stats && (stats.isDirectory() || stats.isSymbolicLink())){ dirExists = true; }
      //       done();
      //     });
      //   });
      //
      //   jobs.push(function(done){
      //     if(dirExists){ return done(); }
      //     fs.mkdir(teamDir, '0766', (error) => {
      //       if(process.env.NODE_ENV !== 'test'){ done(error); }
      //       else{ done(); }
      //     });
      //   });
      //
      //   ['web.js', 'optOut.html'].forEach(function(type){
      //     var source;
      //
      //     jobs.push(function(done){
      //       fs.readFile(sourceDir + path.sep + type, function(error, _source){
      //         if(error){ return done(error); }
      //         source = _source.toString();
      //         done();
      //       });
      //     });
      //
      //     jobs.push(function(done){
      //       var settingJobs = [];
      //
      //       settings.forEach(function(setting){
      //         settingJobs.push(function(settingsDone){
      //           var key = setting.key.toUpperCase();
      //           var regexp = new RegExp('%%' + key + '%%', 'g');
      //           source = source.replace(regexp, setting.value);
      //           settingsDone();
      //         });
      //       });
      //
      //       async.series(settingJobs, done);
      //     });
      //
      //     jobs.push(function(done){
      //       source = source.replace(/%%TRACKINGDOMAIN%%/g, team.trackingDomain);
      //       source = source.replace(/%%TEAMID%%/g, team.id);
      //       source = source.replace(/%%APIROUTE%%/g, api.config.servers.web.urlPathForActions);
      //       done();
      //     });
      //
      //     jobs.push(function(done){
      //       fs.writeFile(teamDir + path.sep + type, source, done);
      //     });
      //   });
      //
      //   async.series(jobs, callback);
      // }
    };

    next();
  },

  start: function(api, next){
    api.teams.load(next);
  },
};
