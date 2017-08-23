const should = require('should')
const async = require('async')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../../specHelper'))
let api
let team

let email = 'admin@localhost.com'
let password = 'password'

describe('integartion:campaigns', () => {
  before(() => { api = specHelper.api })

  before((done) => {
    api.models.Team.findOne().then((_team) => {
      team = _team
      done()
    })
  })

  describe('#stats', () => {
    let campaign
    let messages = []

    before((done) => {
      campaign = api.models.Campaign.build({
        teamGuid: team.guid,
        name: 'my campaign',
        description: 'my campaign',
        type: 'simple',
        folder: 'default',
        transport: 'smtp',
        listGuid: 1,
        templateGuid: 1
      })

      campaign.save().then(() => { done() })
    })

    before((done) => {
      let jobs = [];

      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((i) => {
        jobs.push((next) => {
          let message = api.models.Message.build({
            transport: 'smtp',
            teamGuid: team.guid,
            personGuid: `${i}-${Math.random()}`,
            campaignGuid: campaign.guid,
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

      [0, 1, 2, 3, 4].forEach((i) => {
        jobs.push((next) => {
          let message = messages[i]
          message.reload().then(() => {
            message.readAt = new Date()
            message.save().then(() => { next() }).catch(next)
          }).catch(next)
        })
      });

      [0, 1].forEach((i) => {
        jobs.push((next) => {
          let message = messages[i]
          message.reload().then(() => {
            message.actedAt = new Date()
            message.save().then(() => { next() }).catch(next)
          }).catch(next)
        })
      })

      async.series(jobs, done)
    })

    after((done) => { campaign.destroy().then(() => { done() }).catch(done) })

    after((done) => {
      let jobs = []
      messages.forEach((message) => {
        jobs.push((next) => { message.destroy().then(() => { next() }).catch(next) })
      })

      async.parallel(jobs, done)
    })

    it('has messages', (done) => {
      api.models.Message.count({where: {
        campaignGuid: campaign.guid
      }}).then((count) => {
        count.should.equal(10)
        done()
      }).catch(done)
    })

    it('will return a sample message when viewing the campaign', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:view', {
        campaignGuid: campaign.guid
      }, (response) => {
        should.not.exist(response.error)
        response.campaign.guid.should.equal(campaign.guid)
        response.sampleMessage.body.should.equal('hello')
        done()
      })
    })

    it('returns valid stats', (done) => {
      campaign.stats(new Date(0), new Date(), 'YEAR', (error, terms, buckets) => {
        should.not.exist(error)

        buckets.sentAt.should.equal(10)
        buckets.readAt.should.equal(5)
        buckets.actedAt.should.equal(2)

        let now = new Date()
        let year = now.getFullYear().toString()

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

  describe('#send', () => {
    let campaign
    let person
    let list
    let listPerson
    let template

    before((done) => {
      person = api.models.Person.build({
        teamGuid: team.guid,
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

    before((done) => {
      list = api.models.List.build({
        teamGuid: team.guid,
        name: 'my list',
        description: 'my list',
        type: 'static',
        folder: 'default'
      })

      list.save().then(() => { done() }).catch(done)
    })

    before((done) => {
      template = api.models.Template.build({
        teamGuid: team.guid,
        name: 'my template',
        description: 'my template',
        folder: 'default',
        template: 'Hello there, {{ person.data.firstName }}'
      })

      template.save().then(() => { done() }).catch(done)
    })

    before((done) => {
      listPerson = api.models.ListPerson.build({
        teamGuid: team.guid,
        listGuid: list.guid,
        personGuid: person.guid
      })

      listPerson.save().then(() => { done() }).catch(done)
    })

    before((done) => {
      api.config.tasks.scheduler = true
      api.resque.startScheduler(done)
    })
    before((done) => {
      api.config.tasks.minTaskProcessors = 1
      api.config.tasks.maxTaskProcessors = 1
      api.resque.startMultiWorker(done)
    })
    before((done) => { setTimeout(done, 3000) }) // to allow time for the scheduler to become master

    after((done) => {
      api.config.tasks.scheduler = false
      api.resque.stopScheduler(done)
    })
    after((done) => {
      api.config.tasks.minTaskProcessors = 0
      api.config.tasks.maxTaskProcessors = 0
      api.resque.stopMultiWorker(done)
    })

    after((done) => { person.destroy().then(() => { done() }) })
    after((done) => { template.destroy().then(() => { done() }) })
    after((done) => { list.destroy().then(() => { done() }) })
    after((done) => { listPerson.destroy().then(() => { done() }) })

    describe('send#simple', () => {
      before((done) => {
        campaign = api.models.Campaign.build({
          teamGuid: team.guid,
          name: 'my campaign',
          description: 'my campaign',
          type: 'simple',
          folder: 'default',
          transport: 'smtp',
          listGuid: list.guid,
          templateGuid: template.guid
        })

        campaign.save().then(() => { done() })
      })

      after((done) => { campaign.destroy().then(() => { done() }) })

      it('sends (success)', (done) => {
        let jobs = []

        jobs.push((next) => {
          campaign.send(next)
        })

        jobs.push((next) => {
          setTimeout(next, 3000 + 1) // to allow the sendMessage job to work
        })

        async.series(jobs, (error) => {
          should.not.exist(error)

          api.models.Message.findAll({where: {
            campaignGuid: campaign.guid
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      })

      it('sends (failure; double-send)', (done) => {
        let jobs = []

        jobs.push((next) => {
          campaign.send(next)
        })

        async.series(jobs, (error) => {
          error.toString().should.equal('Error: campaign already sent')
          done()
        })
      })
    })

    describe('send#recurring', () => {
      before((done) => {
        campaign = api.models.Campaign.build({
          teamGuid: team.guid,
          name: 'my campaign',
          description: 'my campaign',
          type: 'recurring',
          reSendDelay: 1,
          folder: 'default',
          transport: 'smtp',
          listGuid: list.guid,
          templateGuid: template.guid
        })

        campaign.save().then(() => { done() }).catch(done)
      })

      after((done) => { campaign.destroy().then(() => { done() }).catch(done) })

      it('sends (success; first time)', (done) => {
        let jobs = []

        jobs.push((next) => {
          campaign.send(next)
        })

        jobs.push((next) => { setTimeout(next, 3000 + 1) })

        async.series(jobs, (error) => {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignGuid: campaign.guid
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      })

      it('sleeps for reSendDelay', (done) => {
        setTimeout(done, 1000)
      })

      it('sends (success; second time)', (done) => {
        let jobs = []

        jobs.push((next) => {
          campaign.send(next)
        })

        jobs.push((next) => { setTimeout(next, 1000 * 5) })

        async.series(jobs, (error) => {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignGuid: campaign.guid
          }}).then((messages) => {
            messages.length.should.equal(2)
            messages[0].body.should.equal('Hello there, fname')
            messages[1].body.should.equal('Hello there, fname')
            messages[0].guid.should.not.equal(messages[1].guid)
            messages[0].personGuid.should.equal(messages[1].personGuid)
            done()
          }).catch(done)
        })
      }).timeout(10 * 1000)

      it('sends (failure; sending too soon)', (done) => {
        let jobs = []

        jobs.push((next) => {
          campaign.updateAttributes({reSendDelay: 9999}).then(() => {
            next()
          }).catch(next)
        })

        jobs.push((next) => {
          campaign.send(next)
        })

        async.series(jobs, (error) => {
          error.toString().should.equal('Error: campaign should not be sent yet')
          done()
        })
      })
    })

    describe('send#trigger', () => {
      before((done) => {
        campaign = api.models.Campaign.build({
          teamGuid: team.guid,
          name: 'my campaign',
          description: 'my campaign',
          type: 'trigger',
          folder: 'default',
          transport: 'smtp',
          listGuid: list.guid,
          templateGuid: template.guid,
          triggerDelay: 10,
          triggerEventMatch: {'type': 'person_created'}
        })

        campaign.save().then(() => { done() }).catch(done)
      })

      after((done) => { campaign.destroy().then(() => { done() }).catch(done) })

      it('sends (failure; not how it is done)', (done) => {
        let jobs = []

        jobs.push((next) => {
          campaign.send(next)
        })

        async.series(jobs, (error) => {
          error.toString().should.equal('Error: Triggered Campaigns are not sent via this method')
          done()
        })
      })
    })

    describe('triggered messages', () => {
      before((done) => {
        campaign = api.models.Campaign.build({
          teamGuid: team.guid,
          name: 'my campaign',
          description: 'my campaign',
          type: 'trigger',
          folder: 'default',
          transport: 'smtp',
          listGuid: list.guid,
          templateGuid: template.guid,
          triggerDelay: 1,
          sendAt: new Date(),
          triggerEventMatch: {'type': '^pageView$', 'page': '^/some/page/.*$'}
        })

        campaign.save().then(() => { done() }).catch(done)
      })

      after((done) => { campaign.destroy().then(() => { done() }).catch(done) })

      it('sends (success)', (done) => {
        let jobs = []

        jobs.push((next) => {
          api.specHelper.runAction('event:create', {
            teamGuid: team.guid,
            device: 'tester',
            type: 'pageView',
            page: 'myPage',
            personGuid: person.guid,
            data: {page: '/some/page/like/this'}
          }, (result) => {
            should.not.exist(result.error)
            next()
          })
        })

        // sleep for the trigger delay
        jobs.push((next) => { setTimeout(next, 1000 * 5) })

        async.series(jobs, (error) => {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignGuid: campaign.guid
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      }).timeout(10 * 1000)

      it('will not send for other events', (done) => {
        let jobs = []

        jobs.push((next) => {
          api.specHelper.runAction('event:create', {
            teamGuid: team.guid,
            device: 'tester',
            type: 'pageView',
            page: 'myPage',
            personGuid: person.guid,
            data: {page: 'otherPage'}
          }, (result) => {
            should.not.exist(result.error)
            next()
          })
        })

        // sleep for the trigger delay
        jobs.push((next) => { setTimeout(next, 1000 * 5) })

        async.series(jobs, (error) => {
          should.not.exist(error)
          api.models.Message.findAll({where: {
            campaignGuid: campaign.guid
          }}).then((messages) => {
            messages.length.should.equal(1)
            messages[0].body.should.equal('Hello there, fname')
            done()
          }).catch(done)
        })
      }).timeout(10 * 1000)
    })
  })
})
