var async = require('async');

exports.messageCreate = {
  name:                   'message:create',
  description:            'message:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId:     { required: false, formatter: function(p){ return parseInt(p); } },
    guid:       { required: false },
    personGuid: { required: true  },
    transport:  { required: true  },
    body:       { required: true  },
    data:       { required: false },
    sentAt:     { required: false  },
    readAt:     { required: false  },
    actedAt:    { required: false  },
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
    var message = new api.models.message(team);

    if(data.params.guid){        message.data.guid = data.params.guid;                 }
    if(data.params.personGuid){  message.data.personGuid = data.params.personGuid;     }
    if(data.params.transport){   message.data.transport = data.params.transport;       }
    if(data.params.body){        message.data.body = data.params.body;                 }
    if(data.params.createdAt){   message.data.createdAt = data.params.createdAt;       }
    if(data.params.sentAt){      message.data.sentAt = new Date(data.params.sentAt);   }
    if(data.params.readAt){      message.data.readAt = new Date(data.params.readAt);   }
    if(data.params.actedAt){     message.data.actedAt = new Date(data.params.actedAt); }

    for(var i in data.params.data){
      if(message.data[i] === null || message.data[i] === undefined){
        message.data[i] = data.params.data[i];
      }
    }

    message.create(function(error){
      if(!error){ data.response.guid = message.data.guid; }
      next(error);
    });

  }
};

exports.messageEdit = {
  name:                   'message:edit',
  description:            'message:edit',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId:     { required: false, formatter: function(p){ return parseInt(p); } },
    guid:       { required: true  },
    personGuid: { required: false },
    transport:  { required: false },
    body:       { required: false },
    data:       { required: false },
    sentAt:     { required: false },
    readAt:     { required: false },
    actedAt:    { required: false }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var message = new api.models.message(team, data.params.guid);

    if(data.params.guid){       message.data.guid = data.params.guid;                 }
    if(data.params.personGuid){ message.data.personGuid = data.params.personGuid;     }
    if(data.params.transport){  message.data.transport = data.params.transport;       }
    if(data.params.body){       message.data.body = data.params.body;                 }
    if(data.params.sentAt){     message.data.sentAt = new Date(data.params.sentAt);   }
    if(data.params.readAt){     message.data.readAt = new Date(data.params.readAt);   }
    if(data.params.actedAt){    message.data.actedAt = new Date(data.params.actedAt); }

    for(var i in data.params.data){ message.data[i] = data.params.data[i]; }

    message.edit(function(error){
      if(error){ return next(error); }
      data.response.message = message.data;
      next();
    });
  }
};

exports.messageView = {
  name:                   'message:view',
  description:            'message:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var message = new api.models.message(team, data.params.guid);

    message.hydrate(function(error){
      if(error){ return next(error); }
      data.response.message = message.data;
      next();
    });
  }
};

exports.messageDelete = {
  name:          'message:delete',
  description:   'message:delete',
  outputExample: {},
  middleware:    [],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:  { required: true }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var message = new api.models.message(team, data.params.guid);

    message.hydrate(function(error){
      if(error){ return next(error); }
      message.del(function(error){
        if(error){ return next(error); }
        next();
      });
    });
  }
};

exports.messageTrack = {
  name:          'message:track',
  description:   'message:track',
  outputExample: {},
  matchExtensionMimeType: true,
  middleware:    [],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true },
    ip:     { required: false },
    link:   { required: false },
    sync:   { required: true, default: false },
    device: { required: false, default: 'message' },
    verb: {
      required: true,
      validator: function(p){
        if(['read', 'act'].indexOf(p) < 0){
          return 'verb not allowed';
        }
        return true;
      }
    },
    lat: {
      required: false,
      formatter: function(p){ return parseFloat(p); }
    },
    lon: {
      required: false,
      formatter: function(p){ return parseFloat(p); }
    }
  },

  run: function(api, data, next){
    var jobs = [];
    var ip = data.params.ip;
    var eventType;
    var event;

    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }

    var message = new api.models.message(team, data.params.guid);

    // testing GUID
    if(data.params.guid === '%%MESSAGEGUID%%'){
      data.toRender = false;
      data.connection.rawConnection.responseHttpCode = 200;
      data.connection.sendFile('tracking.gif');
      return next();
    }

    if(!ip){ ip = data.connection.remoteIP; }

    jobs.push(function(done){
      message.hydrate(done);
    });

    jobs.push(function(done){
      if(data.params.verb === 'read'){
        message.data.readAt = new Date();
        eventType = 'message_read';
      }
      if(data.params.verb === 'act'){
        eventType = 'message_acted_on';
        message.data.actedAt = new Date();
      }
      done();
    });

    jobs.push(function(done){
      message.edit(done);
    });

    jobs.push(function(done){
      event = new api.models.event(team);

      event.data.messageGuid = message.data.guid;
      event.data.personGuid = message.data.personGuid;
      event.data.type = eventType;
      event.data.ip = ip;
      event.data.device = data.params.device;
      event.data.data = {};

      if(data.params.link){
        event.data.data.link = data.params.link;
      }

      if(data.params.lat && data.params.lon){
        event.data.location = {
          lat: data.params.lat,
          lon: data.params.location
        };
      }else{
        try{
          var location = api.maxmind.getLocation(ip);
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

      if(data.params.sync === false){
        event.create(function(error){
          if(error){ api.log('event creation error: ' + error, 'error', event.data); }
        });
        done();
      }else{
        event.create(done);
      }
    });

    async.series(jobs, function(error){
      if(error){ return next(error); }

      data.response.eventGuid = event.data.guid;

      if(data.params.link){
        data.connection.rawConnection.responseHeaders.push(['Location', data.params.link]);
        data.connection.rawConnection.responseHttpCode = 302;
      }else if(data.connection.extension === 'gif'){
        data.toRender = false;
        data.connection.rawConnection.responseHttpCode = 200;
        data.connection.sendFile('tracking.gif');
      }

      api.tasks.enqueueIn((5 * 1000), 'events:process', {teamId: team.id, events: [event.data.guid]}, 'messagebot:events', next);
    });
  }
};
