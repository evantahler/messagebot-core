var async = require('async');

exports.status = {
  name: 'system:status',
  description: 'I will return some basic information about the API',

  outputExample:{
    "id":"192.168.2.11",
    "actionheroVersion":"9.4.1",
    "uptime":10469,
    "serverInformation":{
      "serverName":"actionhero API",
      "apiVersion":"0.0.1",
      "requestDuration":12,
      "currentTime":1420953679624
    }
  },

  run: function(api, data, next){
    var jobs = [];

    jobs.push(function(done){
      data.response.id                 = api.id;
      data.response.healthy            = true;
      data.response.actionheroVersion  = api.actionheroVersion;
      data.response.uptime             = new Date().getTime() - api.bootTime;
      data.response.trackingQueues     = {};
      done();
    });

    ['events', 'people', 'messages'].forEach(function(type){
      ['create', 'edit'].forEach(function(mode){
        jobs.push(function(done){
          var key = 'messagebot:track:' + type + ':' + mode;
          api.cache.listLength(key, function(error, length){
            data.response.trackingQueues[key] = length;
            done(error);
          });
        });
      });
    });

    jobs.push(function(done){
      data.response.totalTrackingEvents = 0;
      Object.keys(data.response.trackingQueues).forEach(function(key){
        data.response.totalTrackingEvents = data.response.totalTrackingEvents + data.response.trackingQueues[key];
      });

      if(data.response.totalTrackingEvents > api.config.messagebot.tracking.maxQueueLength){
        data.response.healthy = false;
        if(data.connection.type === 'web'){
          data.connection.rawConnection.responseHttpCode = 429; // Too Many Requests
        }
      }

      done();
    });

    async.series(jobs, next);
  }
};
