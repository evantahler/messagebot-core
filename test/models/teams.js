var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api
var team

describe('models:team', () => {
  beforeEach(() => { api = specHelper.api })

  afterEach((done) => {
    if (team.isNewRecord === false) {
      team.destroy().then(() => { done() })
    } else {
      done()
    }
  })

  it('can create a new team with valid params', (done) => {
    team = api.models.Team.build({
      name: 'my team',
      trackingDomainRegexp: '^.*.site.com$',
      trackingDomain: 'https://www.site.com'
    })

    team.save().then(() => {
      api.models.Team.findOne({where: {trackingDomain: 'https://www.site.com'}}).then((team) => {
        team.name.should.equal('my team')
        team.trackingDomainRegexp.should.equal('^.*.site.com$')
        done()
      })
    })
  })

  it('will not create a new team with invalid params (missing requirement)', (done) => {
    team = api.models.Team.build({
      name: 'my team'
    })

    team.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.be.above(1)
      errors.errors[0].message.should.equal('trackingDomainRegexp cannot be null')
      errors.errors[1].message.should.equal('trackingDomain cannot be null')
      done()
    })
  })

  it('will not create a new team with invalid params (duplicate key)', (done) => {
    team = api.models.Team.build({
      name: 'my team',
      trackingDomainRegexp: '^.*.site.com$',
      trackingDomain: 'https://www.site.com'
    })

    team.save().then(() => {
      var otherTeam = api.models.Team.build({
        name: 'my team',
        trackingDomainRegexp: '^.*.site.com$',
        trackingDomain: 'https://www.site.com'
      })

      otherTeam.save().then(() => {
        throw new Error('should not get here')
      }).catch((errors) => {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    })
  })
})
