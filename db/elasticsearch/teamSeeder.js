#!/usr/bin/env node

var async = require('async')

var ActionHeroPrototype = require(process.cwd() + '/node_modules/actionhero/actionhero.js')
var actionhero = new ActionHeroPrototype()
var configChanges = {
  logger: { transports: null },
  general: { developmentMode: false }
}

var jobs = []
var api
var teams

jobs.push(function (done) {
  actionhero.initialize({configChanges: configChanges}, function (error, _api) {
    api = _api
    done(error)
  })
})

jobs.push(function (done) {
  api.sequelize.connect(done)
})

jobs.push(function (done) {
  api.sequelize.test(done)
})

jobs.push(function (done) {
  api.models.Team.findAll().then(function (_teams) {
    teams = _teams
    teams.forEach(function (team) {
      var teamJob = function (next) {
        console.log('>> Migrating ElasticSearch for Team #' + team.id + ', (' + team.name + ')')
        api.utils.doShell(['PREFIX="' + team.id + '" node ./node_modules/.bin/ah-elasticsearch-orm migrate'], function (error, lines) {
          console.log(lines)
          next(error)
        }, true)
      }

      jobs.splice(jobs.length - 1, 0, teamJob)
    })

    done()
  }).catch(done)
})

jobs.push(function (done) {
  console.log(teams.length + ' teams migrated OK')
  done()
})

async.series(jobs, function (error) {
  if (error) { throw (error) }
  process.exit()
})
