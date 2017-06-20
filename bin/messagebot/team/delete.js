var async = require('async')
var Table = require('easy-table')

module.exports = {
  name: 'messagebot version',
  description: 'show messagebot version',

  inputs: {
    id: {required: true}
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

    async.series(jobs, function (error) {
      if (error) api.log(error.toString(), 'error')
      next()
    })
  }
}
