const async = require('async')
const Table = require('easy-table')
const faker = require('faker')

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
    let jobs = []
    let team
    let user
    let person

    jobs.push((done) => {
      api.sequelize.connect(done)
    })

    jobs.push((done) => {
      team = api.models.Team.build(data.params)
      team.save().then(() => {
        let tableData = [team.apiData()]

        console.log('New Team\r\n')
        console.log(Table.print(tableData))

        done()
      }).catch(done)
    })

    jobs.push((done) => {
      user = api.models.User.build({
        email: data.params.email,
        teamGuid: team.guid,
        role: 'admin',
        firstName: 'admin',
        lastName: 'admin'
      })

      user.updatePassword(data.params.password, done)
    })

    jobs.push((done) => {
      person = api.models.Person.build({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        source: 'admin',
        device: 'unknown',
        teamGuid: team.guid,
        listOptOuts: [],
        globalOptOut: false
      })

      person.data = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }

      person.save().then(() => {
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      user.personGuid = person.guid
      user.save().then(() => {
        let tableData = [user.apiData()]

        console.log('New User')
        console.log('Email: ' + data.params.email)
        console.log('Password: ' + data.params.password + '\r\n')
        console.log(Table.print(tableData))

        done()
      }).catch(done)
    })

    async.series(jobs, (error) => {
      if (error) console.error(`Error creating team: ${error.toString()}`)
      next()
    })
  }
}
