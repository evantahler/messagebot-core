var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api

describe('system:transports', () => {
  beforeEach(() => { api = specHelper.api })

  it('falis (not logged in)', (done) => {
    api.specHelper.runAction('transports:list', (response) => {
      response.error.should.equal('Error: Please log in to continue')
      done()
    })
  })

  it('returns node status', (done) => {
    specHelper.requestWithLogin(email, password, 'transports:list', {}, (response) => {
      Object.keys(response.transports).length.should.be.above(0)
      response.transports.smtp.name.should.equal('smtp')
      response.transports.smtp.requiredDataKeys.should.deepEqual({ person: ['email'] })
      response.transports.smtp.campaignVariables.should.deepEqual(['from', 'subject'])
      done()
    })
  })
})
