var dateformat = require('dateformat');

var alias = function(api){
  return  'events';
};

var index = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return api.env + '-' + alias(api) + '-' + thisMonth;
};

exports.eventCreate = {
  name:                   'event:create',
  description:            'event:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    ip:           { required: false },
    device:       { required: false },
    uuid:         { required: false },
    userUuid:     { required: true  },
    type:         { required: true  },
    data:         { required: true  },
  },

  run: function(api, data, next){
    var event = new api.models.event(index(api));

    if(data.params.ip){       event.data.ip = data.params.ip;             }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.uuid){     event.data.uuid = data.params.uuid;         }
    if(data.params.userUuid){ event.data.userUuid = data.params.userUuid; }
    if(data.params.type){     event.data.type = data.params.type;         }

    for(var i in data.params.data){
      if(event.data[i] === null || event.data[i] === undefined){
        event.data[i] = data.params.data[i];
      }
    }

    event.create(next);
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
    uuid:         { required: true   },
    userUuid:     { required: false  },
    type:         { required: false  },
    data:         { required: false  },
  },

  run: function(api, data, next){
    var event = new api.models.event(index(api), data.params.uuid);
    
    if(data.params.ip){       event.data.ip = data.params.ip;             }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.device){   event.data.device = data.params.device;     }
    if(data.params.uuid){     event.data.uuid = data.params.uuid;         }
    if(data.params.userUuid){ event.data.userUuid = data.params.userUuid; }
    if(data.params.type){     event.data.type = data.params.type;         }

    for(var i in data.params.data){
      if(event.data[i] === null || event.data[i] === undefined){
        event.data[i] = data.params.data[i];
      }
    }

    event.edit(next);
  }
};

exports.eventView = {
  name:                   'event:view',
  description:            'event:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    uuid:         { required: true },
  },

  run: function(api, data, next){
    var event = new api.models.event(alias(api), data.params.uuid);
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
    uuid:         { required: true },
  },

  run: function(api, data, next){
    var event = new api.models.event(alias(api), data.params.uuid);
    event.delete(function(error){
      if(error){ return next(error); }
      next();
    });
  }
};