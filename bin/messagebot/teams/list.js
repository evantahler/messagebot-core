const async = require('async')
const Table = require('easy-table')

module.exports = {
  name: 'messagebot teams list',
  description: 'list messagebot teams',

  run: function (api, data, next) {
    let jobs = []

    jobs.push((done) => {
      api.sequelize.connect(done)
    })

    jobs.push((done) => {
      api.models.Team.findAll({oder: ['guid', 'asc']}).then((teams) => {
        let tableData = []
        teams.forEach((team) => { tableData.push(team.apiData()) })

        console.log(teams.length + ' Total Teams\r\n')
        console.log(Table.print(tableData))

        done()
      }).catch(done)
    })

    async.series(jobs, next)
  }
}
