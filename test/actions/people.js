const should = require('should')
const async = require('async')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let email = 'admin@localhost.com'
let password = 'password'
let personGuid
let team
let list
let api
let otherPerson

describe('action:person', () => {
  before(() => { api = specHelper.api })
  before((done) => { specHelper.flushRedis(done) })

  before((done) => {
    api.models.Team.findOne().then((_team) => {
      team = _team
      done()
    })
  })

  before((done) => {
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

    otherPerson.save().then(() => {
      done()
    }).catch(done)
  })

  before((done) => {
    list = api.models.List.build({
      teamId: 1,
      name: 'my list',
      description: 'my list',
      type: 'static',
      folder: 'default'
    })

    list.save().then(() => { done() })
  })

  after((done) => { list.destroy().then(() => { done() }) })
  after((done) => { otherPerson.destroy().then(() => { done() }) })

  describe('person:create', () => {
    it('succeeds', (done) => {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake'
        }
      }, (response) => {
        should.not.exist(response.error)
        should.exist(response.person.guid)
        personGuid = response.person.guid
        response.person.source.should.equal('tester')
        response.person.data.email.should.equal('fake@faker.fake')
        done()
      })
    })

    it('succeeds (enqueues a person_created event)', (done) => {
      api.resque.queue.timestamps((error, timestamps) => {
        should.not.exist(error)
        let latestTimetamp = timestamps[0]
        api.tasks.delayedAt(latestTimetamp, (error, queued) => {
          should.not.exist(error)
          let job = queued[0]
          job.args[0].guid.should.equal(personGuid)
          done()
        })
      })
    })

    it('succeeds (can run people:buildCreateEvent)', (done) => {
      api.specHelper.runTask('people:buildCreateEvent', {
        teamId: team.id,
        guid: personGuid
      }, (error) => {
        should.not.exist(error)
        specHelper.requestWithLogin(email, password, 'events:search', {
          searchKeys: ['personGuid'],
          searchValues: [personGuid],
          from: 0,
          size: 999
        }, (response) => {
          should.not.exist(response.error)
          response.total.should.equal(1)
          response.events[0].type.should.equal('person_created')
          response.events[0].ip.should.equal('internal')
          done()
        })
      })
    })

    it('fails (uniqueness failure)', (done) => {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        source: 'tester',
        data: {
          firstName: 'fname',
          lastName: 'lame',
          email: 'fake@faker.fake'
        }
      }, (response) => {
        response.error.should.equal(`Error: personGuid ${personGuid} already exists with email of fake@faker.fake`)
        done()
      })
    })

    it('fails (missing param)', (done) => {
      api.specHelper.runAction('person:create', {
        teamId: team.id,
        data: {}
      }, (response) => {
        response.error.should.equal('Error: source is a required parameter for this action')
        done()
      })
    })
  })

  describe('person:view', () => {
    it('succeeds', (done) => {
      api.specHelper.runAction('person:view', {
        teamId: team.id,
        guid: personGuid
      }, (response) => {
        should.not.exist(response.error)
        response.person.device.should.equal('unknown')
        response.person.data.email.should.equal('fake@faker.fake')
        done()
      })
    })

    it('succeeds (lists included)', (done) => {
      api.models.ListPerson.create({
        teamId: team.id,
        listId: list.id,
        personGuid: personGuid
      }).then(() => {
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          response.lists.length.should.equal(1)
          response.lists[0].name.should.equal('my list')
          done()
        })
      })
    })

    it('fails (not found)', (done) => {
      api.specHelper.runAction('person:view', {
        teamId: team.id,
        guid: 'xxx'
      }, (response) => {
        response.error.should.equal('Error: Person (xxx) not found')
        done()
      })
    })
  })

  describe('person:edit', () => {
    it('succeeds', (done) => {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {email: 'newEmail@faker.fake'}
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('can add arbitrary data', (done) => {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {thing: 'stuff'}
      }, (response) => {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          response.person.data.thing.should.equal('stuff')
          response.person.data.email.should.equal('newEmail@faker.fake')
          done()
        })
      })
    })

    it('can remove arbitrary data', (done) => {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {thing: '_delete'}
      }, (response) => {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          should.not.exist(response.person.data.thing)
          response.person.data.email.should.equal('newEmail@faker.fake')
          done()
        })
      })
    })

    it('fails (uniqueness failure)', (done) => {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: personGuid,
        data: {email: 'otherPerson@faker.fake'}
      }, (response) => {
        response.error.should.equal(`Error: personGuid ${otherPerson.guid} already exists with email of otherPerson@faker.fake`)
        done()
      })
    })

    it('fails (not found)', (done) => {
      api.specHelper.runAction('person:edit', {
        teamId: team.id,
        guid: 'xxx',
        data: {email: 'otherPerson@faker.fake'}
      }, (response) => {
        response.error.should.equal('Error: Person (xxx) not found')
        done()
      })
    })
  })

  describe('person:opt', () => {
    it('can opt-out of a list (and check it)', (done) => {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'out',
        listId: list.id
      }, (response) => {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          response.person.listOptOuts.length.should.equal(1)
          response.person.listOptOuts[0].should.equal(list.id)
          done()
        })
      })
    })

    it('can opt back into a list (and check it)', (done) => {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'in',
        listId: list.id
      }, (response) => {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          response.person.listOptOuts.length.should.equal(0)
          done()
        })
      })
    })

    it('can opt-out of a list (fails, list not found)', (done) => {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'in',
        listId: 999999
      }, (response) => {
        response.error.should.equal('Error: List not found')
        done()
      })
    })

    it('can opt-out globally (and check it)', (done) => {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'out',
        global: true
      }, (response) => {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          response.person.globalOptOut.should.equal(true)
          done()
        })
      })
    })

    it('can opt-in globally (and check it)', (done) => {
      api.specHelper.runAction('person:opt', {
        teamId: team.id,
        guid: personGuid,
        direction: 'in',
        global: true
      }, (response) => {
        should.not.exist(response.error)
        api.specHelper.runAction('person:view', {
          teamId: team.id,
          guid: personGuid
        }, (response) => {
          should.not.exist(response.error)
          response.person.globalOptOut.should.equal(false)
          done()
        })
      })
    })
  })

  describe('people:search', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'people:search', {
        searchKeys: ['data.email'],
        searchValues: ['%@faker.fake'],
        from: 1,
        size: 1
      }, (response) => {
        should.not.exist(response.error)
        response.total.should.equal(2)
        response.people.length.should.equal(1)
        done()
      })
    })

    it('fails (not logged in)', (done) => {
      api.specHelper.runAction('people:search', {
        searchKeys: ['data.email'],
        searchValues: ['%@faker.fake']
      }, (response) => {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('people:aggregation', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['%@faker.fake']
      }, (response) => {
        should.not.exist(response.error)
        Object.keys(response.aggregations).length.should.equal(1)
        let key = Object.keys(response.aggregations)[0]
        let date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.aggregations[key].should.deepEqual({tester: 2})
        done()
      })
    })

    it('fails (not logged in)', (done) => {
      api.specHelper.runAction('people:aggregation', {
        searchKeys: ['data.email'],
        searchValues: ['%@faker.fake']
      }, (response) => {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('person:delete', () => {
    let event
    let message

    before((done) => {
      event = api.models.Event.build({
        messageGuid: Math.random(),
        teamId: team.id,
        personGuid: personGuid,
        ip: '0.0.0.0',
        device: 'phone',
        type: 'boughtTheThing'
      })

      event.save().then(() => {
        done()
      }).catch(done)
    })

    before((done) => {
      message = api.models.Message.build({
        teamId: team.id,
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

    it('succeeds', (done) => {
      api.specHelper.runAction('person:delete', {
        teamId: team.id,
        guid: personGuid
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('succeeds (deletes related personData, listPeople, messages, and events)', (done) => {
      let jobs = []

      jobs.push((next) => {
        api.models.PersonData.count({where: {personGuid: personGuid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push((next) => {
        api.models.Message.count({where: {personGuid: personGuid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push((next) => {
        api.models.MessageData.count({where: {messageGuid: message.guid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push((next) => {
        api.models.Event.count({where: {personGuid: personGuid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push((next) => {
        api.models.EventData.count({where: {eventGuid: event.guid}}).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      jobs.push((next) => {
        api.models.ListPerson.count({ where: { teamId: team.id, personGuid: personGuid } }).then((count) => {
          count.should.equal(0)
          next()
        }).catch(next)
      })

      async.series(jobs, (error) => {
        should.not.exist(error)
        done()
      })
    })

    it('fails (not found)', (done) => {
      api.specHelper.runAction('person:delete', {
        teamId: team.id,
        guid: personGuid
      }, (response) => {
        response.error.should.equal('Error: Person (' + personGuid + ') not found')
        done()
      })
    })
  })
})
