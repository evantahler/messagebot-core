var async = require('async');
var path = require('path');
var packageJSON = require(path.normalize(__dirname + path.sep + '..' + path.sep + '..' + path.sep  + 'package.json'));

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

    data.response.database = {};
    data.response.elasticsearch = {};
    data.response.redis = {};
    data.response.node = {};

    /* ------ Node ------ */

    jobs.push(function(done){
      data.response.node.id                = api.id;
      data.response.node.healthy           = true;
      data.response.node.actionheroVersion = api.actionheroVersion;
      data.response.node.uptime            = new Date().getTime() - api.bootTime;
      data.response.node.version           = packageJSON.version,
      data.response.node.url               = api.config.messagebot.url

      data.response.node.urlHuman = data.response.node.url;
      data.response.node.urlHuman = data.response.node.urlHuman.replace('https://', '');
      data.response.node.urlHuman = data.response.node.urlHuman.replace('http://', '');

      done();
    });

    jobs.push(function(done){
      var intervalJobs = [];
      var intervalTimes = [];

      var i = 0;
      while(i < 10000){
        intervalJobs.push(function(intervalDone){
          var start = process.hrtime();
          process.nextTick(function(){
            var delta = process.hrtime(start);
            var ms = delta[1] / 1000000;
            intervalTimes.push(ms);
            intervalDone();
          });
        });
        i++;
      }

      async.series(intervalJobs, function(){
        var sum = 0;
        intervalTimes.forEach(function(t){ sum += t; })
        data.response.node.avgEventLoopDelay = Math.round(sum / intervalTimes.length * 10000) / 1000;
        if(data.response.node.avgEventLoopDelay > 2){ data.response.node.healthy = false; }
        done();
      });
    });

    jobs.push(function(done){
      data.response.node.memoryUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100;
      done()
    });

    jobs.push(function(done){
      data.response.node.elasticsaerchPendingOperations = api.elasticsearch.pendingOperations;
      data.response.node.elasticsaerchPendingOperationsPercent = Math.round(api.elasticsearch.pendingOperations / api.config.elasticsearch.maxPendingOperations * 10000) / 100;
      if(api.elasticsearch.pendingOperations > api.config.elasticsearch.maxPendingOperations){
        data.response.node.nodeHealthy = false;
      }

      done();
    });

    /* ------ Database ------ */

    data.response.database.healthy = true;
    ['campaign', 'list', 'listPerson', 'template', 'user'].forEach(function(model){
      jobs.push(function(done){
        api.models[model].count().then(function(count){
          data.response.database[model] = count;
          done();
        }).catch(function(error){
          data.response.database.health = false;
          done(error);
        });
      });
    });

    /* ------ ElasticSearch ------ */

    jobs.push(function(done){
      api.elasticsearch.client.info({}, function(error, info){
        data.response.elasticsearch.info = info;
        done(error);
      });
    });

    jobs.push(function(done){
      api.elasticsearch.client.cluster.health({}, function(error, health){
        data.response.elasticsearch.health = health;
        done(error);
      });
    });

    /* ------ Redis ------ */

    ['tasks', 'client'].forEach(function(redisName){
      jobs.push(function(done){
        var redis = api.redis.clients[redisName];
        if(typeof redis.info === 'function'){
          redis.info(function(error, lines){
            lines = lines.split('\n');
            var info = {};
            lines.forEach(function(line){
              line = line.replace('\r', '');
              if(line[0] !== '#' && line.length > 0){
                var parts = line.split(':');
                info[parts[0]] = parts[1];
              }
            });

            data.response.redis[redisName] = {
              healthy:                   true,
              redis_version:             info.redis_version,
              uptime_in_seconds:         parseInt(info.uptime_in_seconds),
              connected_clients:         parseInt(info.connected_clients),
              used_memoryMB:             Math.round(parseInt(info.used_memory) / 1024 / 1024 * 100) / 100,
              total_system_memoryMB:     Math.round(parseInt(info.total_system_memory) / 1024 / 1024 * 100) / 100,
              instantaneous_ops_per_sec: parseFloat(info.instantaneous_ops_per_sec),
              instantaneous_input_kbps:  parseFloat(info.instantaneous_input_kbps),
              instantaneous_output_kbps: parseFloat(info.instantaneous_output_kbps),
            };

            if(data.response.redis[redisName].used_memoryMB / data.response.redis[redisName].total_system_memoryMB > 0.75){
              data.response.redis[redisName].healthy = false;
            }

            done(error);
          });
        }else{
          done();
        }
      });
    });

    async.series(jobs, next);
  }
};
