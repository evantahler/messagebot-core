var async = require('async')
var path = require('path')
var common = require(path.join(__dirname, 'common.js'))

var seed = function (api, callback) {
  var routeBase = process.env.PUBLIC_URL || 'http://' + api.config.servers.web.bindIP + ':' + api.config.servers.web.port
  var usersCount = process.env.USERS_COUNT || 1000
  var jobs = []

  // only create entries within a 1-month window
  var start = new Date()
  start.setMonth(start.getMonth() - 1)
  var end = new Date()

  var i = 0
  while (i < usersCount) {
    jobs.push(function (done) {
      var localJobs = []
      var person
      var message = ''

      // create the person
      localJobs.push(function (next) {
        common.buildPerson(start, end, routeBase, function (error, _person) {
          if (error) { throw error }
          person = _person
          message += 'Created `' + person.data.firstName + ' ' + person.data.lastName + '` + ['
          return next()
        })
      })

      // build events
      localJobs.push(function (next) {
        common.buildFunnel(person, routeBase, function (error, events) {
          if (error) { throw error }
          message += events.join(', ') + ']'
          return next()
        })
      })

      async.series(localJobs, function (error) {
        if (!error) { console.log(message) }
        done(error)
      })
    })
    i++
  }

  async.series(jobs, callback)
}

if (require.main === module) {
  common.connect(function (error, api) {
    if (error) { throw (error) }
    console.log('seeding env with fake data: ' + api.env)
    seed(api, function (error) {
      if (error) { throw error }
      process.exit()
    })
  })
}

exports.seed = seed
