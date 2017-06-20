var async = require('async')
var optimist = require('optimist')
var Table = require('easy-table')

var teamDelete = function (api, callback) {
  var jobs = []
  var team

  var argv = optimist.demand('id').argv

  jobs.push(function (done) {
    api.sequelize.connect(done)
  })

  jobs.push(function (done) {
    api.models.Team.findOne({where: {id: argv.id}}).then(function (_team) {
      if (!_team) { return done(new Error('Team not found')) }
      team = _team

      console.log('About to Delete Team\r\n')
      var tableData = [team.apiData()]
      console.log(Table.print(tableData))

      done()
    }).catch(done)
  });

  ['Event', 'EventData', 'Person', 'PersonData', 'Message', 'MessageData', 'User', 'ListPerson', 'List', 'Campaign', 'Template'].forEach(function (model) {
    jobs.push(function (done) {
      api.models[model].count({where: {teamId: team.id}}).then(function (count) {
        console.log('Delting all (' + count + ') objects for team from table `' + model + '`')
        api.models[model].destroy({where: {teamId: team.id}}).then(function () {
          done()
        }).catch(done)
      }).catch(done)
    })
  })

  jobs.push(function (done) {
    console.log('Deleting team')
    team.destroy().then(function () { done() }).catch(done)
  })

  async.series(jobs, callback)
}

module.exports = teamDelete
