const should = require('should')
const async = require('async')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api

describe('actions:session', () => {
  beforeEach(() => { api = specHelper.api })

  it('can login (happy)', (done) => {
    api.specHelper.runAction('session:create', {
      email: 'admin@localhost.com',
      password: 'password'
    }, (response) => {
      should.not.exist(response.error)
      response.success.should.equal(true)
      response.user.id.should.equal(1)
      response.user.email.should.equal('admin@localhost.com')
      done()
    })
  })

  it('can login (sad)', (done) => {
    api.specHelper.runAction('session:create', {
      email: 'admin@localhost.com',
      password: 'xxx'
    }, (response) => {
      response.error.should.equal('Error: password does not match')
      response.success.should.equal(false)
      done()
    })
  })

  it('when logging in, a session object is created in redis', (done) => {
    api.specHelper.runAction('session:create', {
      email: 'admin@localhost.com',
      password: 'password'
    }, (response) => {
      should.not.exist(response.error)
      let key = api.session.prefix + response.requesterInformation.id
      api.redis.clients.client.get(key, (error, data) => {
        should.not.exist(error)
        data = JSON.parse(data)
        data.userId.should.equal(1)
        data.role.should.equal('admin')
        api.redis.clients.client.ttl(key, (error, ttl) => {
          should.not.exist(error)
          ttl.should.be.within((api.session.ttl - 5000), (api.session.ttl))
          done()
        })
      })
    })
  })

  it('actions can require a logged-in user (success)', (done) => {
    specHelper.requestWithLogin('admin@localhost.com', 'password', 'user:view', {}, (response) => {
      should.not.exist(response.error)
      done()
    })
  })

  it('actions can require a logged-in user (bad auth)', (done) => {
    specHelper.requestWithLogin('admin@localhost.com', 'password', 'user:view', {}, (response) => {
      should.not.exist(response.error)
      done()
    })
  })

  it('actions can require a logged-in user (missing auth)', (done) => {
    api.specHelper.runAction('user:view', {}, (response) => {
      response.error.should.equal('Error: Please log in to continue')
      done()
    })
  })

  it('logging out will delete the seession', (done) => {
    let jobs = []
    let connection = new api.specHelper.Connection()

    jobs.push((next) => {
      connection.params = {email: 'admin@localhost.com', password: 'password'}
      api.specHelper.runAction('session:create', connection, (response) => {
        next(response.error)
      })
    })

    jobs.push((next) => {
      api.specHelper.runAction('user:view', connection, (response) => {
        next(response.error)
      })
    })

    jobs.push((next) => {
      api.specHelper.runAction('session:delete', connection, (response) => {
        next(response.error)
      })
    })

    jobs.push((next) => {
      api.specHelper.runAction('user:view', connection, (response) => {
        response.error.should.equal('Error: Please log in to continue')
        next()
      })
    })

    async.series(jobs, done)
  })
})
