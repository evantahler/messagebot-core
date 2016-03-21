var dateformat = require('dateformat');

var alias = function(api){
  return api.env + '-' + 'events';
};

var index = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return alias(api) + '-' + thisMonth;
};

exports.eventCreate = {
  name:                   'event:create',
  description:            'event:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    sync:         { required: true, default: false },
    ip:           { required: false },
    device:       { required: false },
    guid:         { required: false },
    userGuid:     { required: true  },
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
  },

  run: function(api, data, next){
    var event = new api.models.event(index(api));

    if(data.params.ip){       event.data.ip = data.params.ip;             }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.guid){     event.data.guid = data.params.guid;         }
    if(data.params.userGuid){ event.data.userGuid = data.params.userGuid; }
    if(data.params.type){     event.data.type = data.params.type;         }

    if(data.params.lat && data.params.lon){
      event.data.location = {
        lat: data.params.lat,
        lon: data.params.location
      };
    }else if(data.params.ip){
      try{
        var location = api.maxmind.getLocation(data.params.ip);
        if(location.latitude && location.longitude){
          event.data.location = {
            lat: location.latitude,
            lon: location.longitude
          };
        }
      }catch(e){
        api.log(e, 'error');
      }
    }

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
        if(error){ api.log('event creation error: ' + error, 'error', data.params); }
      });
      data.response.guid = event.data.guid;
      next();
    }else{
      event.create(function(error){
        if(!error){ data.response.guid = event.data.guid; }
        next(error);
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
    ip:           { required: false  },
    device:       { required: false  },
    guid:         { required: true   },
    userGuid:     { required: false  },
    type:         { required: false  },
    data:         { required: false  },
  },

  run: function(api, data, next){
    var event = new api.models.event(index(api), data.params.guid);

    if(data.params.ip){       event.data.ip = data.params.ip;             }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.guid){     event.data.guid = data.params.guid;         }
    if(data.params.userGuid){ event.data.userGuid = data.params.userGuid; }
    if(data.params.type){     event.data.type = data.params.type;         }

    for(var i in data.params.data){ event.data[i] = data.params.data[i]; }

    event.edit(function(error){
      if(error){ return next(error); }
      data.response.event = event.data;
      next();
    });
  }
};

exports.eventView = {
  name:                   'event:view',
  description:            'event:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
  },

  run: function(api, data, next){
    var event = new api.models.event(alias(api), data.params.guid);
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
    guid:         { required: true },
  },

  run: function(api, data, next){
    var event = new api.models.event(alias(api), data.params.guid);
    event.hydrate(function(error){
      if(error){ return next(error); }
      event.delete(function(error){
        if(error){ return next(error); }
        next();
      });
    });
  }
};
