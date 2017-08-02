var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../../specHelper'))
var api

var people = []
var event
var person
var list
var team

describe('integartion:lists', function () {
  before(function () { api = specHelper.api })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  before(function (done) {
    list = api.models.List.build({
      teamId: team.id,
      name: 'my list',
      description: 'my list',
      type: 'static',
      folder: 'default'
    })

    list.save().then(function () { done() }).catch(done)
  })

  after(function (done) { list.destroy().then(() => { done() }).catch(done) })

  describe('#escape', () => {
    it('works', () => {
      list.escape('hi').should.equal('hi')
      list.escape('hi"').should.equal('hi')
      list.escape('hi"f').should.equal('hif')
      list.escape('hi\'bobby drop tables;').should.equal('hibobby drop tables;')
    })
  })

  describe('#associateListPeople', function () {
    ['aaron', 'brian', 'chuck', 'dave', 'evan'].forEach(function (fname) {
      before(function (done) {
        person = api.models.Person.build({
          source: 'tester',
          teamId: team.id,
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

    before(function (done) {
      event = api.models.Event.build({
        teamId: team.id,
        messageGuid: Math.random(),
        personGuid: people[0].guid,
        type: 'boughtTheThing',
        ip: '0.0.0.0',
        device: 'phone'
      })

      event.save().then(() => { done() }).catch(done)
    })

    after(function (done) { event.destroy().then(() => { done() }).catch(done) })
    after(function (done) {
      var jobs = []

      people.forEach(function (person) {
        jobs.push(function (next) {
          person.destroy().then(() => { next() }).catch(next)
        })
      })

      async.series(jobs, done)
    })

    afterEach(function (done) {
      api.models.ListPerson.destroy({
        where: {listId: list.id}
      }).then(function () {
        done()
      }).catch(done)
    })

    it('#associateListPeople (dyanamic, no exlusion)', function (done) {
      list.type = 'dynamic'
      list.personQuery = {firstName: ['e%'], lastName: ['%']}
      list.associateListPeople(function (error, count) {
        should.not.exist(error)
        count.should.equal(1)
        api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
          listPeople.length.should.equal(1)
          listPeople[0].personGuid.should.equal(people[4].guid)
          done()
        })
      })
    })

    it('#associateListPeople (dyanamic, with negation)', function (done) {
      list.type = 'dynamic'
      list.personQuery = {firstName: ['!b%'], device: ['phone']}
      list.associateListPeople(function (error, count) {
        should.not.exist(error)
        count.should.equal(4)
        api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
          listPeople.length.should.equal(4)
          done()
        })
      })
    })

    it('#associateListPeople (dyanamic, with exlusion)', function (done) {
      list.type = 'dynamic'
      list.personQuery = {firstName: ['%']}
      list.eventQuery = {type: ['boughtTheThing']}
      list.associateListPeople(function (error, count) {
        should.not.exist(error)
        count.should.equal(1)
        api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
          listPeople.length.should.equal(1)
          listPeople[0].personGuid.should.equal(people[0].guid)
          done()
        })
      })
    })

    it('#associateListPeople (static)', function (done) {
      list.type = 'static'

      var listPerson = api.models.ListPerson.build({
        teamId: team.id,
        listId: list.id,
        personGuid: people[3].guid
      })

      listPerson.save().then(function () {
        list.associateListPeople(function (error, count) {
          should.not.exist(error)
          count.should.equal(1)
          api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
            listPeople.length.should.equal(1)
            listPeople[0].personGuid.should.equal(people[3].guid)
            listPerson.destroy().then(function () { done() })
          })
        })
      }).catch(done)
    })
  })
})
