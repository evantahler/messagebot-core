const async = require('async')
const Table = require('easy-table')

module.exports = {
  name: 'messagebot team edit',
  description: 'edit a messagebot team',

  inputs: {
    guid: {required: true},
    name: {required: false},
    trackingDomainRegexp: {required: false},
    trackingDomain: {required: false}
  },

  run: function (api, data, next) {
    let jobs = []
    let team

    jobs.push((done) => {
      api.sequelize.connect(done)
    })

    jobs.push((done) => {
      api.models.Team.findOne({where: {guid: data.params.guid}}).then((_team) => {
        if (!_team) { return done(new Error('Team not found')) }
        team = _team
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      ['trackingDomainRegexp', 'trackingDomain', 'name'].forEach((k) => {
        if (data.params[k]) { team[k] = data.params[k] }
      })

      team.save().then(() => { done() }).catch(done)
    })

    jobs.push((done) => {
      api.log('Updated Team\r\n')
      let tableData = [team.apiData()]
      api.log(Table.print(tableData))
      done()
    })

    async.series(jobs, (error) => {
      if (error) api.log(error.toString(), 'error')
      next()
    })
  }
}
