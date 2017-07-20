var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api

describe('general:applicaiton', function () {
  beforeEach(function () { api = specHelper.api })

  it('can boot', function (done) {
    api.running.should.equal(true)
    api.transports.length.should.be.above(0)
    done()
  })

  describe('utils', function () {
    it('api.utils.findInBatches', function (done) {
      var totalUsers = 0
      api.utils.findInBatches(api.models.User, {}, function (user, next) {
        totalUsers++
        next()
      }, function (error) {
        should.not.exist(error)
        totalUsers.should.be.above(0)
        done()
      })
    })

    describe('api.utils.determineActionsTeam', () => {
      it('works for id (success)', (done) => {
        api.utils.determineActionsTeam({params: {teamId: 1}}, (error, team) => {
          should.not.exist(error)
          should.exist(team)
          done()
        })
      })

      it('works for id (failure)', (done) => {
        api.utils.determineActionsTeam({params: {teamId: 99}}, (error, team) => {
          should.not.exist(error)
          should.not.exist(team)
          done()
        })
      })

      it('works for session (success)', (done) => {
        api.utils.determineActionsTeam({session: {teamId: 1}}, (error, team) => {
          should.not.exist(error)
          should.exist(team)
          done()
        })
      })

      it('works for session (failure)', (done) => {
        api.utils.determineActionsTeam({session: {teamId: 99}}, (error, team) => {
          should.not.exist(error)
          should.not.exist(team)
          done()
        })
      })

      // TODO
      it('works for URL (success)')
      it('works for URL (failure)')
    })
  })
})
