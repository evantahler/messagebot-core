var async = require('async')
var Table = require('easy-table')
var optimist = require('optimist')
var faker = require('faker')

var teamCreate = function (api, callback) {
  var jobs = []
  var team
  var user
  var person

  var argv = optimist
    .demand('name')
    .demand('trackingDomainRegexp')
    .demand('trackingDomain')
    .demand('email')
    .default('password', faker.internet.password())
    .argv

  jobs.push(function (done) {
    api.sequelize.connect(done)
  })

  jobs.push(function (done) {
    team = api.models.Team.build(argv)
    team.save().then(function () {
      var tableData = [team.apiData()]

      console.log('New Team\r\n')
      console.log(Table.print(tableData))

      done()
    }).catch(done)
  })

  jobs.push(function (done) {
    user = api.models.User.build({
      email: argv.email,
      teamId: team.id,
      role: 'admin',
      firstName: 'admin',
      lastName: 'admin'
    })

    user.updatePassword(argv.password, done)
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
      console.log('Email: ' + argv.email)
      console.log('Password: ' + argv.password + '\r\n')
      console.log(Table.print(tableData))

      done()
    }).catch(done)
  })

  async.series(jobs, callback)
}

module.exports = teamCreate
