var async = require('async')
var path = require('path')
var packageJSON = require(path.normalize(path.join(__dirname, '..', '..', 'package.json')))

exports.status = {
  name: 'system:status',
  description: 'I will return some basic information about the API',
  middleware: ['logged-in-session'],

  outputExample: {},

  run: function (api, data, next) {
    var jobs = []
    var team

    data.response.database = {}
    data.response.redis = {}
    data.response.node = {}

    /* ------ Node ------ */

    jobs.push((done) => {
      api.models.Team.findOne({where: {id: data.session.teamId}}).then((_team) => {
        if (!_team) { return done(new Error(`Team not found`)) }
        team = _team
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      data.response.node.id = api.id
      data.response.node.healthy = true
      data.response.node.actionheroVersion = api.actionheroVersion
      data.response.node.uptime = new Date().getTime() - api.bootTime
      data.response.node.version = packageJSON.version
      data.response.node.team = team.apiData()

      done()
    })

    jobs.push((done) => {
      var intervalJobs = []
      var intervalTimes = []

      var i = 0
      while (i < 10000) {
        intervalJobs.push((intervalDone) => {
          var start = process.hrtime()
          process.nextTick(() => {
            var delta = process.hrtime(start)
            var ms = (delta[0] * 1000) + (delta[1] / 1000000)
            intervalTimes.push(ms)
            intervalDone()
          })
        })
        i++
      }

      async.series(intervalJobs, () => {
        var sum = 0
        intervalTimes.forEach((t) => { sum += t })
        data.response.node.avgEventLoopDelay = Math.round(sum / intervalTimes.length * 10000) / 1000
        if (data.response.node.avgEventLoopDelay > 2) { data.response.node.healthy = false }
        done()
      })
    })

    jobs.push((done) => {
      data.response.node.memoryUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100
      done()
    })

    /* ------ Database ------ */

    data.response.database.healthy = true;
    ['Event', 'Person', 'Message', 'Campaign', 'List', 'ListPerson', 'Template', 'User', 'Setting'].forEach((model) => {
      jobs.push((done) => {
        api.models[model].count().then((count) => {
          data.response.database[model] = count
          done()
        }).catch((error) => {
          data.response.database.health = false
          done(error)
        })
      })
    });

    /* ------ Redis ------ */

    ['tasks', 'client'].forEach((redisName) => {
      jobs.push((done) => {
        var redis = api.redis.clients[redisName]
        if (typeof redis.info === 'function') {
          redis.info((error, lines) => {
            if (error) { return done(new Error(`Redis Error (${redisName}): ${error}`)) }

            try {
              lines = lines.split('\n')
              var info = {}
              lines.forEach((line) => {
                line = line.replace('\r', '')
                if (line[0] !== '#' && line.length > 0) {
                  var parts = line.split(':')
                  info[parts[0]] = parts[1]
                }
              })

              data.response.redis[redisName] = {
                healthy: true,
                redis_version: info.redis_version,
                uptime_in_seconds: parseInt(info.uptime_in_seconds),
                connected_clients: parseInt(info.connected_clients),
                used_memoryMB: Math.round(parseInt(info.used_memory) / 1024 / 1024 * 100) / 100,
                total_system_memoryMB: Math.round(parseInt(info.total_system_memory) / 1024 / 1024 * 100) / 100,
                instantaneous_ops_per_sec: parseFloat(info.instantaneous_ops_per_sec),
                instantaneous_input_kbps: parseFloat(info.instantaneous_input_kbps),
                instantaneous_output_kbps: parseFloat(info.instantaneous_output_kbps)
              }

              if (data.response.redis[redisName].used_memoryMB / data.response.redis[redisName].total_system_memoryMB > 0.75) {
                data.response.redis[redisName].healthy = false
              }
            } catch (error) {
              if (error) { return done(new Error(`Redis Error (${redisName}): ${error}`)) }
            }

            done()
          })
        } else {
          done()
        }
      })
    })

    jobs.push((done) => {
      api.tasks.details((error, resque) => {
        if (error) { return done(error) }
        data.response.resque = resque
        done()
      })
    })

    async.series(jobs, next)
  }
}
