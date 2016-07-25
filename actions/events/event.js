exports.eventCreate = {
  name:                   'event:create',
  description:            'event:create',
  matchExtensionMimeType: true,
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId:       { required: false, formatter: function(p){ return parseInt(p); } },
    sync:         { required: true, default: false },
    ip:           { required: false },
    device:       { required: true  },
    guid:         { required: false },
    personGuid:   { required: true  },
    messageGuid:  { required: false },
    type:         { required: true  },
    data:         { required: true  },
    lat: {
      required: false,
      formatter: function(p){ return parseFloat(p); }
    },
    lon: {
      required: false,
      formatter: function(p){ return parseFloat(p); }
    },
    createdAt:    {
      required: false,
      formatter: function(p){
        return new Date(parseInt(p));
      }
    }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var event = new api.models.event(team);

    if(data.params.ip){          event.data.ip = data.params.ip;                   }
    if(data.params.device){      event.data.device = data.params.device;           }
    if(data.params.guid){        event.data.guid = data.params.guid;               }
    if(data.params.personGuid){  event.data.personGuid = data.params.personGuid;   }
    if(data.params.messageGuid){ event.data.messageGuid = data.params.messageGuid; }
    if(data.params.type){        event.data.type = data.params.type;               }
    if(data.params.createdAt){   event.data.createdAt = data.params.createdAt;     }

    if(!event.data.ip){ event.data.ip = data.connection.remoteIP; }

    event.data.location = { lat: 0, lon: 0 };
    if(data.params.lat && data.params.lon){
      event.data.location = {
        lat: data.params.lat,
        lon: data.params.location
      };
    }else if(event.data.ip){
      try{
        var location = api.maxmind.getLocation(event.data.ip);
        if(location && location.latitude && location.longitude){
          event.data.location = {
            lat: location.latitude,
            lon: location.longitude
          };
        }
      }catch(e){
        api.log('Geocoding Error: ' +  String(e), 'error');
      }
    }

    if(!event.data.messageGuid){ event.data.messageGuid = 'unknown'; }

    for(var i in data.params.data){
      if(event.data[i] === null || event.data[i] === undefined){
        event.data[i] = data.params.data[i];
      }
    }

    // return without waiting for the crete callback; log errors
    // this effectivley allows the tracking request to 'buffer' in RAM & returning to the client quickly
    // guid will be hydrated syncrhonusly before the save operation
    if(data.params.sync === false){
      event.create(function(error){
        if(error){
          api.log('event creation error: ' + error, 'error', data.params);
        }else{
          api.tasks.enqueueIn((5 * 1000), 'events:process', {teamId: team.id, events: [event.data.guid]}, 'messagebot:events');
        }
      });
      data.response.guid = event.data.guid;
      next();
    }else{
      event.create(function(error){
        if(error){ return next(error); }
        data.response.guid = event.data.guid;
        if(data.connection.extension === 'gif'){
          data.toRender = false;
          data.connection.rawConnection.responseHttpCode = 200;
          data.connection.sendFile('tracking.gif');
        }

        api.tasks.enqueueIn((5 * 1000), 'events:process', {teamId: team.id, events: [event.data.guid]}, 'messagebot:events', next);
      });
    }
  }
};

exports.eventEdit = {
  name:                   'event:edit',
  description:            'event:edit',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId:       { required: false, formatter: function(p){ return parseInt(p); } },
    ip:           { required: false  },
    device:       { required: false  },
    guid:         { required: true   },
    personGuid:   { required: false  },
    messageGuid:  { required: false  },
    type:         { required: false  },
    data:         { required: false  }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var event = new api.models.event(team, data.params.guid);

    if(data.params.ip){          event.data.ip = data.params.ip;                   }
    if(data.params.device){      event.data.device = data.params.device;           }
    if(data.params.guid){        event.data.guid = data.params.guid;               }
    if(data.params.personGuid){  event.data.personGuid = data.params.personGuid;   }
    if(data.params.messageGuid){ event.data.messageGuid = data.params.messageGuid; }
    if(data.params.type){        event.data.type = data.params.type;               }

    for(var i in data.params.data){ event.data[i] = data.params.data[i]; }

    event.edit(function(error){
      if(error){ return next(error); }
      data.response.event = event.data;
      api.tasks.enqueueIn((5 * 1000), 'events:process', {teamId: team.id, events: [event.data.guid]}, 'messagebot:events', next);
    });
  }
};

exports.eventView = {
  name:                   'event:view',
  description:            'event:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var event = new api.models.event(team, data.params.guid);

    event.hydrate(function(error){
      if(error){ return next(error); }
      data.response.event = event.data;
      next();
    });
  }
};

exports.eventDelete = {
  name:                   'event:delete',
  description:            'event:delete',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var event = new api.models.event(team, data.params.guid);

    event.hydrate(function(error){
      if(error){ return next(error); }
      event.del(function(error){
        if(error){ return next(error); }
        next();
      });
    });
  }
};
