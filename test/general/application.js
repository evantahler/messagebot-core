const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api

describe('general:applicaiton', () => {
  beforeEach(() => { api = specHelper.api })

  it('can boot', (done) => {
    api.running.should.equal(true)
    api.transports.length.should.be.above(0)
    done()
  })

  describe('utils', () => {
    it('api.utils.findInBatches', (done) => {
      let totalUsers = 0
      api.utils.findInBatches(api.models.User, {}, (user, next) => {
        totalUsers++
        next()
      }, (error) => {
        should.not.exist(error)
        totalUsers.should.be.above(0)
        done()
      })
    })

    describe('api.utils.determineActionsTeam', () => {
      let teamGuid
      before((done) => {
        api.models.Team.findOne().then((team) => {
          teamGuid = team.guid
          done()
        }).catch(done)
      })

      it('works for id (success)', (done) => {
        api.utils.determineActionsTeam({params: {teamGuid: teamGuid}}, (error, team) => {
          should.not.exist(error)
          should.exist(team)
          done()
        })
      })

      it('works for id (failure)', (done) => {
        api.utils.determineActionsTeam({params: {teamGuid: 99}}, (error, team) => {
          should.not.exist(error)
          should.not.exist(team)
          done()
        })
      })

      it('works for session (success)', (done) => {
        api.utils.determineActionsTeam({session: {teamGuid: teamGuid}}, (error, team) => {
          should.not.exist(error)
          should.exist(team)
          done()
        })
      })

      it('works for session (failure)', (done) => {
        api.utils.determineActionsTeam({session: {teamGuid: 99}}, (error, team) => {
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
