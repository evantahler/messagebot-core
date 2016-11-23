var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api
var eventGuid
var team
var person

describe('actions:event', function () {
  before(function () { api = specHelper.api })
  before(function (done) { specHelper.flushRedis(done) })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  before(function (done) {
    person = new api.models.Person(team)
    person.data.source = 'someSource'
    person.data.device = 'unknown'
    person.data.listOptOuts = []
    person.data.globalOptOut = false
    person.data.data = {
      firstName: 'fname',
      lastName: 'lame',
      email: 'fake@faker.fake'
    }

    person.create(function (error) {
      should.not.exist(error)
      person.hydrate(done)
    })
  })

  after(function (done) { person.del(done) })

  describe('event:create', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('event:create', {
        teamId: team.id,
        sync: true,
        device: 'tester',
        type: 'tester',
        personGuid: person.data.guid,
        data: {thing: 'stuff'},
        ip: '173.247.192.214'
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.guid)
        eventGuid = response.guid
        done()
      })
    })

    it('succeeds (GIF)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/event/create.gif', {
        teamId: team.id,
        sync: true,
        device: 'tester',
        type: 'tester',
        personGuid: person.data.guid
      }, function (response, res) {
        response.toString().indexOf('GIF').should.equal(0)
        res.statusCode.should.equal(200)
        res.headers['x-powered-by'].should.equal('MessageBot')
        res.headers['content-type'].should.equal('image/gif')
        done()
      })
    })

    it('succeeds (geocoding)', function (done) {
      api.specHelper.runAction('event:create', {
        teamId: team.id,
        sync: true,
        device: 'tester',
        type: 'tester',
        personGuid: person.data.guid,
        data: {thing: 'stuff'},
        ip: '173.247.192.214'
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.guid)

        var event = new api.models.Event(team, response.guid)
        event.hydrate(function (error) {
          should.not.exist(error)
          Math.round(event.data.location.lat).should.equal(38)
          Math.round(event.data.location.lon).should.equal(-122)
          done()
        })
      })
    })

    it('succeeds (enqueues a events:process event in the future)', function (done) {
      api.resque.queue.timestamps(function (error, timestamps) {
        should.not.exist(error)
        var latestTimetamp = timestamps[0]
        api.tasks.delayedAt(latestTimetamp, function (error, queued) {
          should.not.exist(error)
          var job = queued[0]
          job.args[0].events.should.deepEqual([eventGuid])
          done()
        })
      })
    })

    it('succeeds (can run events:process and update the user)', function (done) {
      person.data.device.should.equal('unknown')
      should.not.exist(person.data.location)

      api.specHelper.runTask('events:process', {
        teamId: team.id,
        events: [eventGuid]
      }, function (error) {
        should.not.exist(error)
        person.hydrate(function (error) {
          should.not.exist(error)
          Math.round(person.data.location.lat).should.equal(38)
          Math.round(person.data.location.lon).should.equal(-122)
          person.data.device.should.equal('tester')
          done()
        })
      })
    })

    it('fails (missing param)', function (done) {
      api.specHelper.runAction('event:create', {
        teamId: team.id,
        sync: true,
        type: 'tester',
        personGuid: person.data.guid,
        data: {thing: 'stuff'}
      }, function (response) {
        response.error.should.equal('Error: device is a required parameter for this action')
        done()
      })
    })
  })

  describe('event:view', function () {
    // we need to prevent resque delayed job collisiosn for the same timestamp
    before(function (done) { setTimeout(done, 1001) })

    it('succeeds', function (done) {
      api.specHelper.runAction('event:view', {
        teamId: team.id,
        guid: eventGuid
      }, function (response) {
        should.not.exist(response.error)
        response.event.data.thing.should.equal('stuff')
        response.event.personGuid.should.equal(person.data.guid)
        should.exist(response.event.createdAt)
        should.exist(response.event.updatedAt)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('event:view', {
        teamId: team.id,
        guid: '123abc'
      }, function (response) {
        response.error.should.equal('Error: event (123abc) not found')
        done()
      })
    })
  })

  describe('event:edit', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('event:edit', {
        teamId: team.id,
        guid: eventGuid,
        device: 'new_device'
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('event:edit', {
        teamId: team.id,
        guid: '123abc',
        device: 'new_device'
      }, function (response) {
        response.error.should.equal('Error: event (123abc) not found')
        done()
      })
    })
  })

  describe('events:search', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'events:search', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
        form: 0,
        size: 99
      }, function (response) {
        should.not.exist(response.error)
        response.total.should.equal(1)
        response.events.length.should.equal(1)
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('people:search', {
        searchKeys: ['device'],
        searchValues: ['new_device']
      }, function (response) {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('events:aggregation', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'events:aggregation', {
        searchKeys: ['device'],
        searchValues: ['new_device'],
        interval: 'day'
      }, function (response) {
        should.not.exist(response.error)
        Object.keys(response.aggregations).length.should.equal(2)
        response.aggregations.tester[0].doc_count.should.equal(1)
        response.selections.should.deepEqual(['tester'])
        response.selectionsName.should.equal('types')
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['device'],
        searchValues: ['new_device']
      }, function (response) {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('event:delete', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('event:delete', {
        teamId: team.id,
        guid: eventGuid
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('event:delete', {
        teamId: team.id,
        guid: eventGuid
      }, function (response) {
        response.error.should.equal('Error: event (' + eventGuid + ') not found')
        done()
      })
    })
  })
})
