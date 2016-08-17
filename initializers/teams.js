'use strict';

var fs     = require('fs');
var path   = require('path');
var async  = require('async');

module.exports = {
  initialize: function(api, next){
    api.teams = {
      teams: [],

      load: function(callback){
        var jobs = [];
        if(api.running){
          api.models.team.findAll().then(function(teams){
            api.teams.teams = teams;
            teams.forEach(function(team){
              jobs.push(function(done){
                api.teams.renderClientTracking(team, done);
              });
            });

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

      renderClientTracking: function(team, callback){
        var jobs = [];
        var sourceDir = path.normalize([__dirname, '..', 'client'].join(path.sep));
        var publicDir = api.config.general.paths.public[0];
        var teamDir = path.normalize([publicDir, 'tracking', team.id].join(path.sep));
        var dirExists = false;

        jobs.push(function(done){
          fs.lstat(teamDir, function(error, stats){
            if(error && !error.toString().match(/ENOENT/)){ return done(error); }
            if(stats && (stats.isDirectory() || stats.isSymbolicLink())){ dirExists = true; }
            done();
          });
        });

        jobs.push(function(done){
          if(dirExists){ return done(); }
          fs.mkdir(teamDir, '0766', done);
        });

        ['web.js', 'optOut.html'].forEach(function(type){
          var source;

          jobs.push(function(done){
            fs.readFile(sourceDir + path.sep + type, function(error, _source){
              if(error){ return done(error); }
              source = _source.toString();
              done();
            });
          });

          jobs.push(function(done){
            source = source.replace(/%%TRACKINGDOMAIN%%/g, team.trackingDomain);
            source = source.replace(/%%TEAMID%%/g, team.id);
            source = source.replace(/%%APIROUTE%%/g, api.config.servers.web.urlPathForActions);

            fs.writeFile(teamDir + path.sep + type, source, done);
          });
        });

        async.series(jobs, callback);
      }
    };

    next();
  },

  start: function(api, next){
    api.teams.load(next);
  },
};
