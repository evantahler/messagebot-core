var async = require('async');

module.exports = {
  initialize: function(api, next){

    api.events = {
      triggerCampaign: function(event, callback){
        // TODO
        callback();
      },

      propigateLocationToPerson: function(event, callback){
        if(!event.data.location){ return callback(); }

        var person = new api.models.person(event.data.personGuid);
        person.hydrate(function(error){
          if(error){ return callback(error); }

          person.data.device = event.data.device;

          person.data.location = {
            lat: event.data.location.lat,
            lon: event.data.location.lon
          };

          person.edit(callback);
        });
      },
    };

    next();
  }
};
