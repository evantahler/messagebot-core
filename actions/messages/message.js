var async = require('async');

exports.messageCreate = {
  name:                   'message:create',
  description:            'message:create',
  outputExample:          {},
  middleware:             ['require-team'],

  inputs: {
    teamId:     { required: false, formatter: function(p){ return parseInt(p); } },
    guid:       { required: false },
    personGuid: { required: true  },
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    transport:  { required: true  },
    body:       { required: true  },
    data:       { required: false, default: {} },
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
    var message = new api.models.message(data.team);
    message.data = data.params;

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
  middleware:             ['require-team'],

  inputs: {
    teamId:     { required: false, formatter: function(p){ return parseInt(p); } },
    guid:       { required: true  },
    personGuid: { required: false },
    campaignId: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
    transport:  { required: false },
    body:       { required: false },
    data:       { required: false },
    sentAt:     { required: false },
    readAt:     { required: false },
    actedAt:    { required: false }
  },

  run: function(api, data, next){
    var message = new api.models.message(data.team, data.params.guid);
    message.data = data.params;

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
  middleware:             ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var message = new api.models.message(data.team, data.params.guid);

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
  middleware:    ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:  { required: true }
  },

  run: function(api, data, next){
    var message = new api.models.message(data.team, data.params.guid);

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
  middleware:    ['require-team'],

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

    var message = new api.models.message(data.team, data.params.guid);

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
      event = new api.models.event(data.team);

      event.data.messageGuid = message.data.guid;
      event.data.personGuid = message.data.personGuid;
      event.data.type = eventType;
      event.data.ip = ip;
      event.data.device = data.params.device;
      event.data.data = {};

      if(data.params.link){ event.data.data.link = data.params.link; }

      event.data.location = api.geolocation.build(data.params, event.data.ip);

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

      api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 2, 'events:process', {teamId: data.team.id, events: [event.data.guid]}, 'messagebot:events', next);
    });
  }
};
