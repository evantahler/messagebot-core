const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let email = 'admin@localhost.com'
let password = 'password'
let api

describe('settings', () => {
  beforeEach(() => { api = specHelper.api })

  describe('settings:list', () => {
    it('falis (not logged in)', (done) => {
      api.specHelper.runAction('settings:list', (response) => {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })

    it('succedes', (done) => {
      specHelper.requestWithLogin(email, password, 'settings:list', {}, (response) => {
        should.not.exist(response.error)
        Object.keys(response.team).length.should.be.above(0)
        Object.keys(response.settings).length.should.be.above(0)
        should.exist(response.settings['client:tracking:web:cookieName'])
        done()
      })
    })
  })

  describe('settings:edit', () => {
    it('falis (not logged in)', (done) => {
      api.specHelper.runAction('setting:edit', (response) => {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })

    it('succedes', (done) => {
      specHelper.requestWithLogin(email, password, 'setting:edit', {
        key: 'client:tracking:web:cookieName',
        value: 'someCookie'
      }, (response) => {
        should.not.exist(response.error)

        specHelper.requestWithLogin(email, password, 'settings:list', {}, (response) => {
          should.not.exist(response.error)
          response.settings['client:tracking:web:cookieName'].value.should.equal('someCookie')
          done()
        })
      })
    })
  })
})
