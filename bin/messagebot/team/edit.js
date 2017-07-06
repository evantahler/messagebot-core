var async = require('async')
var Table = require('easy-table')

module.exports = {
  name: 'messagebot team edit',
  description: 'edit a messagebot team',

  inputs: {
    id: {required: true},
    name: {required: false},
    trackingDomainRegexp: {required: false},
    trackingDomain: {required: false}
  },

  run: function (api, data, next) {
    var jobs = []
    var team

    jobs.push(function (done) {
      api.sequelize.connect(done)
    })

    jobs.push(function (done) {
      api.models.Team.findOne({where: {id: data.params.id}}).then(function (_team) {
        if (!_team) { return done(new Error('Team not found')) }
        team = _team
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      ['trackingDomainRegexp', 'trackingDomain', 'name'].forEach(function (k) {
        if (data.params[k]) { team[k] = data.params[k] }
      })

      team.save().then(function () { done() }).catch(done)
    })

    jobs.push(function (done) {
      api.log('Updated Team\r\n')
      var tableData = [team.apiData()]
      api.log(Table.print(tableData))
      done()
    })

    async.series(jobs, function (error) {
      if (error) api.log(error.toString(), 'error')
      next()
    })
  }
}
