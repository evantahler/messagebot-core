const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api

describe('general:seeds', () => {
  before(() => { api = specHelper.api })

  let teamGuid
  before((done) => {
    api.models.Team.findOne().then((team) => {
      teamGuid = team.guid
      done()
    }).catch(done)
  })

  let userGuid
  before((done) => {
    api.models.User.findOne().then((user) => {
      userGuid = user.guid
      done()
    }).catch(done)
  })

  it('has the first team', (done) => {
    api.models.Team.findOne({where: {guid: teamGuid}}).then((team) => {
      team.guid.should.equal(teamGuid)
      team.name.should.equal('TestTeam')
      team.trackingDomain.should.equal('http://tracking.site.com')
      team.trackingDomainRegexp.should.equal('^.*$')

      done()
    })
  })

  it('has the first admin user', (done) => {
    api.models.User.findOne({where: {guid: userGuid}}).then((user) => {
      user.guid.should.equal(userGuid)
      user.teamGuid.should.equal(teamGuid)
      user.email.should.equal('admin@localhost.com')
      user.role.should.equal('admin')

      user.checkPassword('password', (error, match) => {
        should.not.exist(error)
        match.should.equal(true)
        done()
      })
    })
  })
})
