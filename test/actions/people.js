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
    otherPerson = api.models.Person.build({
      teamId: team.id,
      source: 'tester',
      device: 'phone',
      listOptOuts: [],
      globalOptOut: false
    })
    otherPerson.data = {
      firstName: 'fname',
      lastName: 'lname',
      email: 'otherPerson@faker.fake'
    }

    otherPerson.save().then(function () {
      done()
    }).catch(done)
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
  after(function (done) { otherPerson.destroy().then(function () { done() }) })

  describe('person:create', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake'
        }
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.person.guid)
        personGuid = response.person.guid
        response.person.source.should.equal('tester')
        response.person.data.email.should.equal('fake@faker.fake')
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
          from: 0,
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
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake'
        }
      }, function (response) {
        response.error.should.equal(`Error: personGuid ${personGuid} already exists with email of fake@faker.fake`)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
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
        response.error.should.equal('Error: Person (xxx) not found')
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
        response.error.should.equal(`Error: personGuid ${otherPerson.guid} already exists with email of otherPerson@faker.fake`)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: 'xxx',
        data: {email: 'otherPerson@faker.fake'}
      }, function (response) {
        response.error.should.equal('Error: Person (xxx) not found')
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
        searchValues: ['%@faker.fake'],
        from: 1,
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
        searchValues: ['%@faker.fake']
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
        searchValues: ['%@faker.fake']
      }, function (response) {
        should.not.exist(response.error)
        Object.keys(response.aggregations).length.should.equal(1)
        var key = Object.keys(response.aggregations)[0]
        var date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.aggregations[key].should.deepEqual({tester: 2})
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['%@faker.fake']
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
      event = api.models.Event.build({
        messageGuid: Math.random(),
        personGuid: personGuid,
        ip: '0.0.0.0',
        device: 'phone',
        type: 'boughtTheThing'
      })

      event.save().then(() => {
        done()
      }).catch(done)
    })

    before(function (done) {
      message = api.models.Message.build({
        transport: 'smtp',
        personGuid: personGuid,
        campaignId: 1,
        body: '',
        view: {},
        sentAt: new Date()
      })

      message.save().then(() => {
        done()
      }).catch(done)
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

    it('succeeds (deletes related personData, listPeople, messages, and events)', function (done) {
      var jobs = []

      jobs.push(function (next) {
        api.models.PersonData.count({where: {personGuid: personGuid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push(function (next) {
        api.models.Message.count({where: {personGuid: personGuid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push(function (next) {
        api.models.MessageData.count({where: {messageGuid: message.guid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push(function (next) {
        api.models.Event.count({where: {personGuid: personGuid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push(function (next) {
        api.models.EventData.count({where: {eventGuid: event.guid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push(function (next) {
        api.models.ListPerson.count({ where: { teamId: team.id, personGuid: personGuid } }).then(function (count) {
          count.should.equal(0)
          next()
        }).catch(next)
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
        response.error.should.equal('Error: Person (' + personGuid + ') not found')
        done()
      })
    })
  })
})
