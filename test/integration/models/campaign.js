var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../../specHelper'))
var api
var team

describe('integartion:campaigns', function () {
  before(function () { api = specHelper.api })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  describe('#stats', function () {
    var campaign
    var messages = []

    before(function (done) {
      campaign = api.models.Campaign.build({
        teamId: 1,
        name: 'my campaign',
        description: 'my campaign',
        type: 'simple',
        folder: 'default',
        transport: 'smtp',
        listId: 1,
        templateId: 1
      })

      campaign.save().then(function () { done() })
    })

    before(function (done) {
      var jobs = [];

      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (i) {
        jobs.push(function (next) {
          var message = api.models.Message.build({
            transport: 'smtp',
            teamId: 1,
            personGuid: `${i}-${Math.random()}`,
            campaignId: campaign.id,
            body: 'hello',
            view: {},
            sentAt: new Date()
          })

          message.save().then(() => {
            messages.push(message)
            next()
          }).catch(next)
        })
      });

      [0, 1, 2, 3, 4].forEach(function (i) {
        jobs.push(function (next) {
          var message = messages[i]
          message.reload().then(() => {
            message.readAt = new Date()
            message.save().then(() => { next() }).catch(next)
          }).catch(next)
        })
      });

      [0, 1].forEach(function (i) {
        jobs.push(function (next) {
          var message = messages[i]
          message.reload().then(() => {
            message.actedAt = new Date()
            message.save().then(() => { next() }).catch(next)
          }).catch(next)
        })
      })

      async.series(jobs, done)
    })

    after(function (done) { campaign.destroy().then(function () { done() }).catch(done) })

    after(function (done) {
      var jobs = []
      messages.forEach(function (message) {
        jobs.push(function (next) { message.destroy().then(() => { next() }).catch(next) })
      })

      async.parallel(jobs, done)
    })

    it('has messages', function (done) {
      api.models.Message.count({where: {
        campaignId: campaign.id
      }}).then((count) => {
        count.should.equal(10)
        done()
      }).catch(done)
    })

    it('returns valid stats', function (done) {
      campaign.stats(new Date(0), new Date(), 'YEAR', function (error, terms, buckets) {
        should.not.exist(error)

        buckets.sentAt.should.equal(10)
        buckets.readAt.should.equal(5)
        buckets.actedAt.should.equal(2)

        var now = new Date()
        var year = now.getFullYear().toString()

        Object.keys(terms.sentAt[0]).length.should.equal(1)
        Object.keys(terms.sentAt[0])[0].should.equal(year)
        Object.keys(terms.readAt[0]).length.should.equal(1)
        Object.keys(terms.readAt[0])[0].should.equal(year)
        Object.keys(terms.actedAt[0]).length.should.equal(1)
        Object.keys(terms.actedAt[0])[0].should.equal(year)

        terms.sentAt[0][year].should.deepEqual({smtp: 10})
        terms.readAt[0][year].should.deepEqual({smtp: 5})
        terms.actedAt[0][year].should.deepEqual({smtp: 2})

        done()
      })
    })
  })

  describe('#send', function () {
    var campaign
    var person
    var list
    var listPerson
    var template

    before(function (done) {
      person = api.models.Person.build({
        teamId: 1,
        source: 'tester',
        device: 'phone',
        listOptOuts: [],
        globalOptOut: false
      })

      person.data = {
        firstName: 'fname',
        lastName: 'lame',
        email: 'fake@faker.fake'
      }

      person.save().then(() => { done() }).catch(done)
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

    before(function (done) {
      template = api.models.Template.build({
        teamId: 1,
        name: 'my template',
        description: 'my template',
        folder: 'default',
        template: 'Hello there, {{ person.data.firstName }}'
      })

      template.save().then(function () { done() })
    })

    before(function (done) {
      listPerson = api.models.ListPerson.build({
        teamId: 1,
        listId: list.id,
        personGuid: person.guid
      })

      listPerson.save().then(() => { done() }).catch(done)
    })

    before(function (done) {
      api.config.tasks.scheduler = true
      api.resque.startScheduler(done)
    })
    before(function (done) {
      api.config.tasks.minTaskProcessors = 1
      api.config.tasks.maxTaskProcessors = 1
      api.resque.startMultiWorker(done)
    })
    before(function (done) { setTimeout(done, 3000) }) // to allow time for the scheduler to become master

    after(function (done) {
      api.config.tasks.scheduler = false
      api.resque.stopScheduler(done)
    })
    after(function (done) {
      api.config.tasks.minTaskProcessors = 0
      api.config.tasks.maxTaskProcessors = 0
      api.resque.stopMultiWorker(done)
    })

    after(function (done) { person.destroy().then(() => { done() }) })
    after(function (done) { template.destroy().then(function () { done() }) })
    after(function (done) { list.destroy().then(function () { done() }) })
    after(function (done) { listPerson.destroy().then(function () { done() }) })

    describe('send#simple', function () {
      before(function (done) {
        campaign = api.models.Campaign.build({
          teamId: 1,
          name: 'my campaign',
          description: 'my campaign',
          type: 'simple',
          folder: 'default',
          transport: 'smtp',
          listId: list.id,
          templateId: template.id
        })

        campaign.save().then(function () { done() })
      })

      after(function (done) { campaign.destroy().then(function () { done() }) })

      it('sends (success)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          campaign.send(next)
        })

        jobs.push(function (next) {
          setTimeout(next, 3000 + 1) // to allow the sendMessage job to work
        })

        async.series(jobs, function (error) {
          should.not.exist(error)

          api.models.Message.findAll({where: {
            campaignId: campaign.id
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      })

      it('sends (failure; double-send)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          campaign.send(next)
        })

        async.series(jobs, function (error) {
          error.toString().should.equal('Error: campaign already sent')
          done()
        })
      })
    })

    describe('send#recurring', function () {
      before(function (done) {
        campaign = api.models.Campaign.build({
          teamId: 1,
          name: 'my campaign',
          description: 'my campaign',
          type: 'recurring',
          reSendDelay: 1,
          folder: 'default',
          transport: 'smtp',
          listId: list.id,
          templateId: template.id
        })

        campaign.save().then(function () { done() }).catch(done)
      })

      after(function (done) { campaign.destroy().then(function () { done() }).catch(done) })

      it('sends (success; first time)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          campaign.send(next)
        })

        jobs.push(function (next) { setTimeout(next, 3000 + 1) })

        async.series(jobs, function (error) {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignId: campaign.id
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      })

      it('sleeps for reSendDelay', function (done) {
        setTimeout(done, 1000)
      })

      it('sends (success; second time)', function (done) {
        this.timeout(10 * 1000)
        var jobs = []

        jobs.push(function (next) {
          campaign.send(next)
        })

        jobs.push(function (next) { setTimeout(next, 1000 * 5) })

        async.series(jobs, function (error) {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignId: campaign.id
          }}).then((messages) => {
            messages.length.should.equal(2)
            messages[0].body.should.equal('Hello there, fname')
            messages[1].body.should.equal('Hello there, fname')
            messages[0].guid.should.not.equal(messages[1].guid)
            messages[0].personGuid.should.equal(messages[1].personGuid)
            done()
          }).catch(done)
        })
      })

      it('sends (failure; sending too soon)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          campaign.updateAttributes({reSendDelay: 9999}).then(function () {
            next()
          }).catch(next)
        })

        jobs.push(function (next) {
          campaign.send(next)
        })

        async.series(jobs, function (error) {
          error.toString().should.equal('Error: campaign should not be sent yet')
          done()
        })
      })
    })

    describe('send#trigger', function () {
      before(function (done) {
        campaign = api.models.Campaign.build({
          teamId: 1,
          name: 'my campaign',
          description: 'my campaign',
          type: 'trigger',
          folder: 'default',
          transport: 'smtp',
          listId: list.id,
          templateId: template.id,
          triggerDelay: 10,
          triggerEventMatch: {'type': 'person_created'}
        })

        campaign.save().then(function () { done() }).catch(done)
      })

      after(function (done) { campaign.destroy().then(function () { done() }).catch(done) })

      it('sends (failure; not how it is done)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          campaign.send(next)
        })

        async.series(jobs, function (error) {
          error.toString().should.equal('Error: Triggered Campaigns are not sent via this method')
          done()
        })
      })
    })

    describe('triggered messages', function () {
      before(function (done) {
        campaign = api.models.Campaign.build({
          teamId: 1,
          name: 'my campaign',
          description: 'my campaign',
          type: 'trigger',
          folder: 'default',
          transport: 'smtp',
          listId: list.id,
          templateId: template.id,
          triggerDelay: 1,
          triggerEventMatch: {'type': 'pageView', data: {'page': 'myPage'}}
        })

        campaign.save().then(function () { done() }).catch(done)
      })

      after(function (done) { campaign.destroy().then(function () { done() }).catch(done) })

      it('sends (success)', function (done) {
        this.timeout(10 * 1000)
        var jobs = []

        jobs.push(function (next) {
          api.specHelper.runAction('event:create', {
            teamId: team.id,
            sync: true,
            device: 'tester',
            type: 'pageView',
            page: 'myPage',
            personGuid: person.guid,
            data: {page: 'myPage'}
          }, function (result) {
            should.not.exist(result.error)
            next()
          })
        })

        // sleep for the trigger delay
        jobs.push(function (next) { setTimeout(next, 1000 * 5) })

        async.series(jobs, function (error) {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignId: campaign.id
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      })

      it('will not send for other events', function (done) {
        this.timeout(10 * 1000)
        var jobs = []

        jobs.push(function (next) {
          api.specHelper.runAction('event:create', {
            teamId: team.id,
            sync: true,
            device: 'tester',
            type: 'pageView',
            page: 'myPage',
            personGuid: person.guid,
            data: {page: 'otherPage'}
          }, function (result) {
            should.not.exist(result.error)
            next()
          })
        })

        // sleep for the trigger delay
        jobs.push(function (next) { setTimeout(next, 1000 * 5) })

        async.series(jobs, function (error) {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignId: campaign.id
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      })
    })
  })
})
