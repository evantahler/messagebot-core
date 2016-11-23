var async = require('async')
var Table = require('easy-table')
var optimist = require('optimist')

var teamEdit = function (api, callback) {
  var jobs = []
  var team

  var argv = optimist
    .demand('id')
    .describe('trackingDomainRegexp', 'trackingDomainRegexp')
    .describe('trackingDomain', 'trackingDomain')
    .describe('name', 'name')
    .argv

  jobs.push(function (done) {
    api.sequelize.connect(done)
  })

  jobs.push(function (done) {
    api.models.Team.findOne({where: {id: argv.id}}).then(function (_team) {
      if (!_team) { return done(new Error('Team not found')) }
      team = _team
      done()
    }).catch(done)
  })

  jobs.push(function (done) {
    ['trackingDomainRegexp', 'trackingDomain', 'name'].forEach(function (k) {
      if (argv[k]) { team[k] = argv[k] }
    })

    team.save().then(function () { done() }).catch(done)
  })

  jobs.push(function (done) {
    console.log('Updated Team\r\n')
    var tableData = [team.apiData()]
    console.log(Table.print(tableData))
    done()
  })

  async.series(jobs, callback)
}

module.exports = teamEdit
