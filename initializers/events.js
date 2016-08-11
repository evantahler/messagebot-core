var async = require('async');

module.exports = {
  initialize: function(api, next){

    api.events = {
      triggerCampaign: function(team, event, callback){
        var jobs = [];

        // TODO: Cache Campaigns like we cache teams
        api.models.campaign.findAll({where: {
          teamId: team.id,
          type: 'trigger',
        }}).then(function(campaigns){
          campaigns.forEach(function(campaign){
            var matched = true;
            Object.keys(campaign.triggerEventMatch).forEach(function(k){
              if(!event.data[k]){ matched = false; }
              else{
                var regexp = new RegExp(campaign.triggerEventMatch[k]);
                if(!event.data[k].match(regexp)){ matched = false; }
              }

              if(matched === true){
                jobs.push(function(done){
                  var delay = 1;
                  if(campaign.triggerDelay){ delay = campaign.triggerDelay * 1000; }
                  api.tasks.enqueueIn(delay, 'campaigns:triggerEventCheck', {
                    teamId: team.id,
                    eventGuid: event.data.guid,
                    personGuid: event.data.personGuid,
                    campaignId: campaign.id,
                    listId: campaign.listId,
                  }, 'messagebot:campaigns', done);
                });
              }
            });
          });

          async.series(jobs, callback);
        }).catch(callback);
      },

      propigateLocationToPerson: function(team, event, callback){
        if(!event.data.location){ return callback(); }

        var person = new api.models.person(team, event.data.personGuid);
        person.hydrate(function(error){
          if(error){ return callback(error); }

          if(event.data.device !== 'message'){
            person.data.device = event.data.device;
          }

          if(event.data.location && event.data.location.lat && event.data.location.lon){
            person.data.location = {
              lat: event.data.location.lat,
              lon: event.data.location.lon
            };
          }

          person.edit(callback);
        });
      },
    };

    next();
  }
};
