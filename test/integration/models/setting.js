var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api
var team

describe('integartion:settings', function () {
  before(function () { api = specHelper.api })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  it('seeded the settings for the team at boot', function (done) {
    api.models.Setting.findAll({where: {teamId: team.id}}).then(function (settings) {
      settings.length.should.be.above(0)
      done()
    })
  })
})
