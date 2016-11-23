var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api

describe('general:seeds', function () {
  beforeEach(function () { api = specHelper.api })

  it('has the first team', function (done) {
    api.models.Team.findOne({where: {id: 1}}).then(function (team) {
      team.id.should.equal(1)
      team.name.should.equal('TestTeam')
      team.trackingDomain.should.equal('http://tracking.site.com')
      team.trackingDomainRegexp.should.equal('^.*$')

      done()
    })
  })

  it('has the first admin user', function (done) {
    api.models.user.findOne({where: {id: 1}}).then(function (user) {
      user.id.should.equal(1)
      user.teamId.should.equal(1)
      user.email.should.equal('admin@localhost.com')
      user.role.should.equal('admin')

      user.checkPassword('password', function (error, match) {
        should.not.exist(error)
        match.should.equal(true)
        done()
      })
    })
  })
})
