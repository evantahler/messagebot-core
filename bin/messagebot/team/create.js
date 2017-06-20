var async = require('async')
var Table = require('easy-table')
var faker = require('faker')

module.exports = {
  name: 'messagebot team create',
  description: 'create a new mesagebot team',

  inputs: {
    name: {required: true},
    trackingDomainRegexp: {required: true},
    trackingDomain: {required: true},
    email: {required: true},
    password: {required: true, default: faker.internet.password()}
  },

  run: function (api, data, next) {
    var jobs = []
    var team
    var user
    var person

    jobs.push(function (done) {
      api.sequelize.connect(done)
    })

    jobs.push(function (done) {
      team = api.models.Team.build(data.params)
      team.save().then(function () {
        var tableData = [team.apiData()]

        console.log('New Team\r\n')
        console.log(Table.print(tableData))

        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      user = api.models.User.build({
        email: data.params.email,
        teamId: team.id,
        role: 'admin',
        firstName: 'admin',
        lastName: 'admin'
      })

      user.updatePassword(data.params.password, done)
    })

    jobs.push(function (done) {
      person = api.models.Person.build({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        source: 'admin',
        device: 'unknown',
        teamId: team.id,
        listOptOuts: null,
        globalOptOut: false
      })

      person.save().then(function () {
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      user.personGuid = person.guid
      user.save().then(function () {
        var tableData = [user.apiData()]

        console.log('New User')
        console.log('Email: ' + data.params.email)
        console.log('Password: ' + data.params.password + '\r\n')
        console.log(Table.print(tableData))

        done()
      }).catch(done)
    })

    async.series(jobs, function (error) {
      if (error) api.log(error.toString(), 'error')
      next()
    })
  }
}
