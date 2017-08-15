var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../../specHelper'))
var api
var team

describe('integartion:settings', () => {
  before(() => { api = specHelper.api })

  before((done) => {
    api.models.Team.findOne().then((_team) => {
      team = _team
      done()
    })
  })

  it('seeded the settings for the team at boot', (done) => {
    api.models.Setting.findAll({where: {teamId: team.id}}).then((settings) => {
      settings.length.should.be.above(0)
      done()
    })
  })
})
