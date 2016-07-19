#!/usr/bin/env node

var exec  = require('child_process').exec;
var async  = require('async');

var ActionHeroPrototype = require(process.cwd() + '/node_modules/actionhero/actionhero.js').actionheroPrototype;
var actionhero = new ActionHeroPrototype();
var configChanges = {
  logger:  { transports: null },
  general: { developmentMode: false }
};

var jobs = [];
var api;
var teams;

var doBash = function(commands, callback, silent){
  if(!silent){ silent = false; }
  if(!Array.isArray(commands)){ commands = [commands]; }
  var fullCommand = '/bin/bash -c \'' + commands.join(' && ') + '\'';
  if(!silent){ console.log('>> ' + fullCommand); }
  exec(fullCommand, function(error, data){
    callback(error, data);
  });
};

jobs.push(function(done){
  actionhero.initialize({configChanges: configChanges}, function(error, _api){
    api = _api;
    done(error);
  });
});

jobs.push(function(done){
  api.sequelize.connect(done);
});

jobs.push(function(done){
  api.sequelize.test(done);
});

jobs.push(function(done){
  api.models.team.findAll().then(function(_teams){
    teams = _teams;
    teams.forEach(function(team){
      var teamJob = function(next){
        console.log('>> Migrating ElasticSearch for Team #' + team.id + ', (' + team.name + ')');
        doBash(['PREFIX="' + api.utils.cleanTeamName(team.name) + '" node ./node_modules/.bin/ah-elasticsearch-orm migrate'], function(error, lines){
          console.log(lines);
          next(error);
        }, true);
      };

      jobs.splice(jobs.length - 1, 0, teamJob);
    });

    done();
  }).catch(done);
});

jobs.push(function(done){
  console.log(teams.length + ' teams migrated OK');
  done();
});

async.series(jobs, function(error){
  if(error){ throw(error); }
  process.exit();
});
