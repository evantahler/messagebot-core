var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../../specHelper'))
var api

describe('integartion:lists', function () {
  describe('#associateListPeople', function () {
    var people = []
    var event
    var person
    var list
    var team

    before(function () { api = specHelper.api })

    before(function (done) {
      api.models.Team.findOne().then(function (_team) {
        team = _team
        done()
      })
    });

    ['aaron', 'brian', 'chuck', 'dave', 'evan'].forEach(function (fname) {
      before(function (done) {
        person = new api.models.Person(team)
        person.data.source = 'tester'
        person.data.device = 'phone'
        person.data.listOptOuts = []
        person.data.globalOptOut = false
        person.data.data = {
          firstName: fname,
          lastName: 'lname',
          email: fname + '.lname@faker.fake'
        }

        person.create(function (error) {
          people.push(person)
          done(error)
        })
      })
    })

    before(function (done) {
      event = new api.models.Event(team)
      event.data.messageGuid = Math.random()
      event.data.personGuid = people[0].data.guid
      event.data.type = 'boughtTheThing'
      event.data.ip = '0.0.0.0'
      event.data.device = 'phone'
      event.create(done)
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
    after(function (done) { event.del(done) })
    after(function (done) {
      var jobs = []

      people.forEach(function (person) {
        jobs.push(function (next) {
          person.del(next)
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
      list.personQuery = {wildcard: {'data.firstName': 'e*'}}
      list.associateListPeople(function (error, count) {
        should.not.exist(error)
        count.should.equal(1)
        api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
          listPeople.length.should.equal(1)
          listPeople[0].personGuid.should.equal(people[4].data.guid)
          done()
        })
      })
    })

    it('#associateListPeople (dyanamic, with exlusion)', function (done) {
      list.type = 'dynamic'
      list.personQuery = {wildcard: {'data.firstName': '*'}}
      list.eventQuery = {term: {'type': 'boughtthething'}}
      list.associateListPeople(function (error, count) {
        should.not.exist(error)
        count.should.equal(1)
        api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
          listPeople.length.should.equal(1)
          listPeople[0].personGuid.should.equal(people[0].data.guid)
          done()
        })
      })
    })

    it('#associateListPeople (static)', function (done) {
      list.type = 'static'

      var listPerson = api.models.ListPerson.build({
        teamId: team.id,
        listId: list.id,
        personGuid: people[3].data.guid
      })

      listPerson.save().then(function () {
        list.associateListPeople(function (error, count) {
          should.not.exist(error)
          count.should.equal(1)
          api.models.ListPerson.findAll({where: {listId: list.id}}).then(function (listPeople) {
            listPeople.length.should.equal(1)
            listPeople[0].personGuid.should.equal(people[3].data.guid)
            listPerson.destroy().then(function () { done() })
          })
        })
      }).catch(done)
    })
  })
})
