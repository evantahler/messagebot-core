var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var personGuid
var team
var list
var api
var otherPerson

describe('action:person', function () {
  before(function () { api = specHelper.api })
  before(function (done) { specHelper.flushRedis(done) })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  before(function (done) {
    otherPerson = new api.models.Person(team)
    otherPerson.data.source = 'tester'
    otherPerson.data.device = 'phone'
    otherPerson.data.listOptOuts = []
    otherPerson.data.globalOptOut = false
    otherPerson.data.data = {
      firstName: 'fname',
      lastName: 'lame',
      email: 'otherPerson@faker.fake'
    }

    otherPerson.create(done)
  })

  before(function (done) {
    list = api.models.List.build({
      teamId: 1,
      name: 'my list',
      description: 'my list',
      type: 'static',
      folder: 'default'
    })

    list.save().then(function () { done() })
  })

  after(function (done) { list.destroy().then(function () { done() }) })
  after(function (done) { otherPerson.del(done) })

  describe('person:create', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        sync: true,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake'
        }
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.guid)
        personGuid = response.guid
        done()
      })
    })

    it('succeeds (enqueues a person_created event)', function (done) {
      api.resque.queue.timestamps(function (error, timestamps) {
        should.not.exist(error)
        var latestTimetamp = timestamps[0]
        api.tasks.delayedAt(latestTimetamp, function (error, queued) {
          should.not.exist(error)
          var job = queued[0]
          job.args[0].guid.should.equal(personGuid)
          done()
        })
      })
    })

    it('succeeds (can run people:buildCreateEvent)', function (done) {
      api.specHelper.runTask('people:buildCreateEvent', {
        teamId: team.id,
        guid: personGuid
      }, function (error) {
        should.not.exist(error)
        specHelper.requestWithLogin(email, password, 'events:search', {
          searchKeys: ['personGuid'],
          searchValues: [personGuid],
          form: 0,
          size: 999
        }, function (response) {
          should.not.exist(response.error)
          response.total.should.equal(1)
          response.events[0].type.should.equal('person_created')
          response.events[0].ip.should.equal('internal')
          done()
        })
      })
    })

    it('fails (uniqueness failure)', function (done) {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        sync: true,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake'
        }
      }, function (response) {
        response.error.should.equal('Error: uniqueFields:data.email uniqueness violated via #' + personGuid)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        sync: true,
        data: {}
      }, function (response) {
        response.error.should.equal('Error: source is a required parameter for this action')
        done()
      })
    })
  })

  describe('person:view', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('person:view', {
        teamId: team.id,
        guid: personGuid
      }, function (response) {
        should.not.exist(response.error)
        response.person.device.should.equal('unknown')
        response.person.data.email.should.equal('fake@faker.fake')
        done()
      })
    })

    it('succeeds (lists included)', function (done) {
      api.models.ListPerson.create({
        teamId: team.id,
        listId: list.id,
        personGuid: personGuid
      }).then(function () {
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, function (response) {
          should.not.exist(response.error)
          response.lists.length.should.equal(1)
          response.lists[0].name.should.equal('my list')
          done()
        })
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('person:view', {
        teamId: team.id,
        guid: 'xxx'
      }, function (response) {
        response.error.should.equal('Error: person (xxx) not found')
        done()
      })
    })
  })

  describe('person:edit', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {email: 'newEmail@faker.fake'}
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {email: 'otherPerson@faker.fake'}
      }, function (response) {
        response.error.should.equal('Error: uniqueFields:data.email uniqueness violated via #' + otherPerson.data.guid)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: 'xxx',
        data: {email: 'otherPerson@faker.fake'}
      }, function (response) {
        response.error.should.equal('Error: person (xxx) not found')
        done()
      })
    })
  })

  describe('person:opt', function () {
    it('can opt-out of a list (and check it)', function (done) {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'out',
        listId: list.id
      }, function (response) {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, function (response) {
          should.not.exist(response.error)
          response.person.listOptOuts.length.should.equal(1)
          response.person.listOptOuts[0].should.equal(list.id)
          done()
        })
      })
    })

    it('can opt back into a list (and check it)', function (done) {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'in',
        listId: list.id
      }, function (response) {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, function (response) {
          should.not.exist(response.error)
          response.person.listOptOuts.length.should.equal(0)
          done()
        })
      })
    })

    it('can opt-out of a list (fails, list not found)', function (done) {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'in',
        listId: 999999
      }, function (response) {
        response.error.should.equal('Error: List not found')
        done()
      })
    })

    it('can opt-out globally (and check it)', function (done) {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'out',
        global: true
      }, function (response) {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, function (response) {
          should.not.exist(response.error)
          response.person.globalOptOut.should.equal(true)
          done()
        })
      })
    })

    it('can opt-in globally (and check it)', function (done) {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'in',
        global: true
      }, function (response) {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, function (response) {
          should.not.exist(response.error)
          response.person.globalOptOut.should.equal(false)
          done()
        })
      })
    })
  })

  describe('people:search', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'people:search', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
        form: 1,
        size: 1
      }, function (response) {
        should.not.exist(response.error)
        response.total.should.equal(2)
        response.people.length.should.equal(1)
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('people:search', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake']
      }, function (response) {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('people:aggregation', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
        interval: 'day'
      }, function (response) {
        should.not.exist(response.error)
        Object.keys(response.aggregations).length.should.equal(2)
        response.aggregations.tester[0].doc_count.should.equal(2)
        response.selections.should.deepEqual(['tester'])
        response.selectionsName.should.equal('sources')
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['*@faker.fake'],
        interval: 'day'
      }, function (response) {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('person:delete', function () {
    var event
    var message

    before(function (done) {
      event = new api.models.Event(team)
      event.data.messageGuid = Math.random()
      event.data.personGuid = personGuid
      event.data.type = 'boughtTheThing'
      event.data.ip = '0.0.0.0'
      event.data.device = 'phone'
      event.create(done)
    })

    before(function (done) {
      message = new api.models.Message(team)
      message.data.personGuid = personGuid
      message.data.transport = 'smtp'
      message.data.campaignId = '1'
      message.data.body = ''
      message.data.view = {}
      message.data.sentAt = new Date()
      message.create(done)
    })

    it('succeeds', function (done) {
      api.specHelper.runAction('person:delete', {
        teamId: team.id,
        guid: personGuid
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('succeeds (deletes related listPeople, messages, and events)', function (done) {
      var jobs = []

      jobs.push(function (next) {
        var checkMessage = new api.models.Message(team, message.data.guid)
        checkMessage.hydrate(function (error) {
          String(error).should.equal('Error: message (' + message.data.guid + ') not found')
          next()
        })
      })

      jobs.push(function (next) {
        var checkEvent = new api.models.Event(team, event.data.guid)
        checkEvent.hydrate(function (error) {
          String(error).should.equal('Error: event (' + event.data.guid + ') not found')
          next()
        })
      })

      jobs.push(function (done) {
        api.models.ListPerson.count({ where: { teamId: team.id, personGuid: personGuid } }).then(function (count) {
          count.should.equal(0)
          done()
        })
      })

      async.series(jobs, function (error) {
        should.not.exist(error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('person:delete', {
        teamId: team.id,
        guid: personGuid
      }, function (response) {
        response.error.should.equal('Error: person (' + personGuid + ') not found')
        done()
      })
    })
  })
})
