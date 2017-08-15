const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api

describe('general:seeds', () => {
  beforeEach(() => { api = specHelper.api })

  it('has the first team', (done) => {
    api.models.Team.findOne({where: {id: 1}}).then((team) => {
      team.id.should.equal(1)
      team.name.should.equal('TestTeam')
      team.trackingDomain.should.equal('http://tracking.site.com')
      team.trackingDomainRegexp.should.equal('^.*$')

      done()
    })
  })

  it('has the first admin user', (done) => {
    api.models.User.findOne({where: {id: 1}}).then((user) => {
      user.id.should.equal(1)
      user.teamId.should.equal(1)
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
