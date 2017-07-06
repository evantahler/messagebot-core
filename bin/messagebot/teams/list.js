var async = require('async')
var Table = require('easy-table')

module.exports = {
  name: 'messagebot teams list',
  description: 'list messagebot teams',

  run: function (api, data, next) {
    var jobs = []

    jobs.push(function (done) {
      api.sequelize.connect(done)
    })

    jobs.push(function (done) {
      api.models.Team.findAll({oder: ['id', 'asc']}).then(function (teams) {
        var tableData = []
        teams.forEach(function (team) { tableData.push(team.apiData()) })

        api.log(teams.length + ' Total Teams\r\n')
        api.log(Table.print(tableData))

        done()
      }).catch(done)
    })

    async.series(jobs, next)
  }
}
