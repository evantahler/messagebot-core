const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let email = 'admin@localhost.com'
let password = 'password'
let api
let eventGuid
let team
let person

describe('actions:event', () => {
  before(() => { api = specHelper.api })
  before((done) => { specHelper.flushRedis(done) })

  before((done) => {
    api.models.Team.findOne().then((_team) => {
      team = _team
      done()
    })
  })

  before((done) => {
    person = api.models.Person.build({
      teamGuid: team.guid,
      source: 'someSource',
      device: 'unknown',
      listOptOuts: [],
      globalOptOut: false
    })
    person.data = {
      firstName: 'fname',
      lastName: 'lame',
      email: 'fake@faker.fake'
    }

    person.save().then(() => {
      person.hydrate(done)
    }).catch(done)
  })

  after((done) => { person.destroy().then(() => { done() }) })

  describe('event:create', () => {
    it('succeeds', (done) => {
      api.specHelper.runAction('event:create', {
        teamGuid: team.guid,
        device: 'tester',
        type: 'tester',
        personGuid: person.guid,
        data: {thing: 'stuff'},
        ip: '173.247.192.214'
      }, (response) => {
        should.not.exist(response.error)
        should.exist(response.event.guid)
        eventGuid = response.event.guid
        done()
      })
    })

    it('succeeds (GIF)', (done) => {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/event/create.gif', {
        teamGuid: team.guid,
        device: 'tester',
        type: 'tester',
        personGuid: person.guid
      }, (response, res) => {
        response.toString().indexOf('GIF').should.equal(0)
        res.statusCode.should.equal(200)
        res.headers['x-powered-by'].should.equal('MessageBot')
        res.headers['content-type'].should.equal('image/gif')
        done()
      })
    })

    it('succeeds (geocoding)', (done) => {
      api.specHelper.runAction('event:create', {
        teamGuid: team.guid,
        device: 'tester',
        type: 'tester',
        personGuid: person.guid,
        data: {thing: 'stuff'},
        ip: '8.8.8.8'
      }, (response) => {
        should.not.exist(response.error)
        should.exist(response.event.guid)
        response.event.lat.should.be.within(0, 100)
        response.event.lng.should.be.within(-100, 0)
        done()
      })
    })

    it('succeeds (enqueues a events:process event in the future)', (done) => {
      api.resque.queue.timestamps((error, timestamps) => {
        should.not.exist(error)
        let latestTimetamp = timestamps[0]
        api.tasks.delayedAt(latestTimetamp, (error, queued) => {
          should.not.exist(error)
          let job = queued[0]
          job.args[0].events.should.deepEqual([eventGuid])
          done()
        })
      })
    })

    it('succeeds (can run events:process and update the user)', (done) => {
      person.device.should.equal('unknown')
      should.not.exist(person.location)

      api.specHelper.runTask('events:process', {
        teamGuid: team.guid,
        events: [eventGuid]
      }, (error) => {
        should.not.exist(error)
        person.reload().then(() => {
          person.hydrate((error) => {
            should.not.exist(error)
            Math.round(person.lat).should.equal(38)
            Math.round(person.lng).should.equal(-122)
            person.device.should.equal('tester')
            done()
          })
        }).catch(done)
      })
    })

    it('fails (missing param)', (done) => {
      api.specHelper.runAction('event:create', {
        teamGuid: team.guid,
        type: 'tester',
        personGuid: person.guid,
        data: {thing: 'stuff'}
      }, (response) => {
        response.error.should.equal('Error: device is a required parameter for this action')
        done()
      })
    })
  })

  describe('event:view', () => {
    // we need to prevent resque delayed job collisiosn for the same timestamp
    before((done) => { setTimeout(done, 1001) })

    it('succeeds', (done) => {
      api.specHelper.runAction('event:view', {
        teamGuid: team.guid,
        guid: eventGuid
      }, (response) => {
        should.not.exist(response.error)
        response.event.data.thing.should.equal('stuff')
        response.event.personGuid.should.equal(person.guid)
        should.exist(response.event.createdAt)
        should.exist(response.event.updatedAt)
        done()
      })
    })

    it('fails (not found)', (done) => {
      api.specHelper.runAction('event:view', {
        teamGuid: team.guid,
        guid: '123abc'
      }, (response) => {
        response.error.should.equal('Error: Event (123abc) not found')
        done()
      })
    })
  })

  describe('event:edit', () => {
    it('succeeds', (done) => {
      api.specHelper.runAction('event:edit', {
        teamGuid: team.guid,
        guid: eventGuid,
        device: 'new_device'
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', (done) => {
      api.specHelper.runAction('event:edit', {
        teamGuid: team.guid,
        guid: '123abc',
        device: 'new_device'
      }, (response) => {
        response.error.should.equal('Error: Event (123abc) not found')
        done()
      })
    })
  })

  describe('events:search', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'events:search', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
        from: 0,
        size: 99
      }, (response) => {
        should.not.exist(response.error)
        response.total.should.equal(1)
        response.events.length.should.equal(1)
        done()
      })
    })

    it('fails (not logged in)', (done) => {
      api.specHelper.runAction('people:search', {
        searchKeys: ['device'],
        searchValues: ['new_device']
      }, (response) => {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('events:aggregation', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'events:aggregation', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
        interval: 'date'
      }, (response) => {
        should.not.exist(response.error)
        Object.keys(response.aggregations).length.should.equal(1)
        let key = Object.keys(response.aggregations)[0]
        let date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.aggregations[key].should.deepEqual({tester: 1})
        done()
      })
    })

    it('fails (not logged in)', (done) => {
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['device'],
        searchValues: ['new_device']
      }, (response) => {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('event:delete', () => {
    it('succeeds', (done) => {
      api.specHelper.runAction('event:delete', {
        teamGuid: team.guid,
        guid: eventGuid
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', (done) => {
      api.specHelper.runAction('event:delete', {
        teamGuid: team.guid,
        guid: eventGuid
      }, (response) => {
        response.error.should.equal('Error: Event (' + eventGuid + ') not found')
        done()
      })
    })
  })
})
