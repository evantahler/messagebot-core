'use strict';

var async = require('async');

exports.task = {
  name:          'events:process',
  description:   'events:process',
  frequency:     0,
  queue:         'messagebot:events',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var loadJobs = [];
    var workJobs = [];
    var events = [];

    var team = api.utils.determineActionsTeam({params: params});

    params.events.forEach(function(eventGuid){
      loadJobs.push(function(done){
        var event = new api.models.event(team, eventGuid);
        event.hydrate(function(error){
          if(error){ return done(error); }
          events.push(event);
          done();
        });
      });
    });

    loadJobs.push(function(done){
      events.forEach(function(event){

        workJobs.push(function(workDone){
          api.events.triggerCampaign(team, event, workDone);
        });

        workJobs.push(function(workDone){
          api.events.propigateLocationToPerson(team, event, workDone);
        });

      });
      done();
    });

    loadJobs.push(function(done){
      async.series(workJobs, done);
    });

    async.series(loadJobs, function(error){ next(error); });
  }
};
