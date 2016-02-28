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
      done();
    });

    jobs.push(function(done){
      data.response.pendingOperations = api.elasticsearch.pendingOperations;
      if(api.elasticsearch.pendingOperations > api.config.messagebot.tracking.maxPendingOperations){
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
