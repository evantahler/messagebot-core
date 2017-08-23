const should = require('should')
const async = require('async')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../../specHelper'))
let api

let people = []
let event
let person
let list
let team

describe('integartion:lists', () => {
  before(() => { api = specHelper.api })

  before((done) => {
    api.models.Team.findOne().then((_team) => {
      team = _team
      done()
    })
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

  after((done) => { list.destroy().then(() => { done() }).catch(done) })

  describe('#escape', () => {
    it('works', () => {
      list.escape('hi').should.equal('hi')
      list.escape('hi"').should.equal('hi')
      list.escape('hi"f').should.equal('hif')
      list.escape('hi\'bobby drop tables;').should.equal('hibobby drop tables;')
    })
  })

  describe('#associateListPeople', () => {
    ['aaron', 'brian', 'chuck', 'dave', 'evan'].forEach((fname) => {
      before((done) => {
        person = api.models.Person.build({
          source: 'tester',
          teamGuid: team.guid,
          device: 'phone',
          listOptOuts: [],
          globalOptOut: false
        })

        person.data = {
          firstName: fname,
          lastName: 'lname',
          email: fname + '.lname@faker.fake'
        }

        person.save().then(() => {
          people.push(person)
          done()
        }).catch(done)
      })
    })

    before((done) => {
      event = api.models.Event.build({
        teamGuid: team.guid,
        messageGuid: Math.random(),
        personGuid: people[0].guid,
        type: 'boughtTheThing',
        ip: '0.0.0.0',
        device: 'phone'
      })

      event.save().then(() => { done() }).catch(done)
    })

    after((done) => { event.destroy().then(() => { done() }).catch(done) })
    after((done) => {
      let jobs = []

      people.forEach((person) => {
        jobs.push((next) => {
          person.destroy().then(() => { next() }).catch(next)
        })
      })

      async.series(jobs, done)
    })

    afterEach((done) => {
      api.models.ListPerson.destroy({
        where: {listGuid: list.guid}
      }).then(() => {
        done()
      }).catch(done)
    })

    it('#associateListPeople (dyanamic, no exlusion)', (done) => {
      list.type = 'dynamic'
      list.personQuery = {firstName: ['e%'], lastName: ['%']}
      list.associateListPeople((error, count) => {
        should.not.exist(error)
        count.should.equal(1)
        api.models.ListPerson.findAll({where: {listGuid: list.guid}}).then((listPeople) => {
          listPeople.length.should.equal(1)
          listPeople[0].personGuid.should.equal(people[4].guid)
          done()
        })
      })
    })

    it('#associateListPeople (dyanamic, with negation)', (done) => {
      list.type = 'dynamic'
      list.personQuery = {firstName: ['!b%'], device: ['phone']}
      list.associateListPeople((error, count) => {
        should.not.exist(error)
        count.should.equal(4)
        api.models.ListPerson.findAll({where: {listGuid: list.guid}}).then((listPeople) => {
          listPeople.length.should.equal(4)
          done()
        })
      })
    })

    it('#associateListPeople (dyanamic, with exlusion)', (done) => {
      list.type = 'dynamic'
      list.personQuery = {firstName: ['%']}
      list.eventQuery = {type: ['boughtTheThing']}
      list.associateListPeople((error, count) => {
        should.not.exist(error)
        count.should.equal(1)
        api.models.ListPerson.findAll({where: {listGuid: list.guid}}).then((listPeople) => {
          listPeople.length.should.equal(1)
          listPeople[0].personGuid.should.equal(people[0].guid)
          done()
        })
      })
    })

    it('#associateListPeople (static)', (done) => {
      list.type = 'static'

      let listPerson = api.models.ListPerson.build({
        teamGuid: team.guid,
        listGuid: list.guid,
        personGuid: people[3].guid
      })

      listPerson.save().then(() => {
        list.associateListPeople((error, count) => {
          should.not.exist(error)
          count.should.equal(1)
          api.models.ListPerson.findAll({where: {listGuid: list.guid}}).then((listPeople) => {
            listPeople.length.should.equal(1)
            listPeople[0].personGuid.should.equal(people[3].guid)
            listPerson.destroy().then(() => { done() })
          }).catch(done)
        })
      }).catch(done)
    })
  })
})
