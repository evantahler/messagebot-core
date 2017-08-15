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

    jobs.push((done) => {
      api.sequelize.connect(done)
    })

    jobs.push((done) => {
      api.models.Team.findOne({where: {id: data.params.id}}).then((_team) => {
        if (!_team) { return done(new Error('Team not found')) }
        team = _team

        api.log('About to Delete Team\r\n')
        var tableData = [team.apiData()]
        api.log(Table.print(tableData))

        done()
      }).catch(done)
    });

    ['Event', 'EventData', 'Person', 'PersonData', 'Message', 'MessageData', 'User', 'ListPerson', 'List', 'Campaign', 'Template'].forEach((model) => {
      jobs.push((done) => {
        api.models[model].count({where: {teamId: team.id}}).then((count) => {
          api.log('Delting all (' + count + ') objects for team from table `' + model + '`')
          api.models[model].destroy({where: {teamId: team.id}}).then(() => {
            done()
          }).catch(done)
        }).catch(done)
      })
    })

    jobs.push((done) => {
      api.log('Deleting team')
      team.destroy().then(() => { done() }).catch(done)
    })

    async.series(jobs, (error) => {
      if (error) api.log(error.toString(), 'error')
      next()
    })
  }
}
