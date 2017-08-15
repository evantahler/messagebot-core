const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let email = 'admin@localhost.com'
let password = 'password'
let api

describe('system:status', () => {
  beforeEach(() => { api = specHelper.api })

  it('falis (not logged in)', (done) => {
    api.specHelper.runAction('system:status', (response) => {
      response.error.should.equal('Error: Please log in to continue')
      done()
    })
  })

  it('returns node status', (done) => {
    specHelper.requestWithLogin(email, password, 'system:status', {}, (response) => {
      response.database.healthy.should.equal(true);
      ['Campaign', 'List', 'ListPerson', 'Template', 'User'].forEach((table) => {
        should.exist(response.database[table])
      })

      response.redis.tasks.healthy.should.equal(true)
      response.redis.client.healthy.should.equal(true)

      response.node.id.should.equal('test-server')
      response.node.healthy.should.equal(true)
      response.node.uptime.should.be.above(0)
      response.node.avgEventLoopDelay.should.be.below(1)
      response.node.memoryUsedMB.should.be.below(150)
      response.node.team.id.should.equal(1)
      response.node.team.name.should.equal('TestTeam')

      done()
    })
  })
})
