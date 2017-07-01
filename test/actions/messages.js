var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api
var messageGuid
var team

describe('actions:message', function () {
  before(function () { api = specHelper.api })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  describe('message:create', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        personGuid: 'messagesTestPersonGuid',
        transport: 'smtp',
        campaignId: 1,
        body: 'hello',
        view: {},
        sentAt: new Date()
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.message.guid)
        messageGuid = response.message.guid
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        guid: messageGuid,
        personGuid: 'messagesTestPersonGuid',
        transport: 'smtp',
        campaignId: 1,
        body: 'hello',
        view: {},
        sentAt: new Date()
      }, function (response) {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })

    it('fails (missing param)', function (done) {
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        transport: 'smtp',
        campaignId: 1,
        body: 'hello',
        view: {},
        sentAt: new Date()
      }, function (response) {
        response.error.should.equal('Error: personGuid is a required parameter for this action')
        done()
      })
    })
  })

  describe('message:view', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('message:view', {
        teamId: team.id,
        guid: messageGuid
      }, function (response) {
        should.not.exist(response.error)
        response.message.guid.should.equal(messageGuid)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('message:view', {
        teamId: team.id,
        guid: 'xxx'
      }, function (response) {
        response.error.should.equal('Error: Message (xxx) not found')
        done()
      })
    })
  })

  describe('message:edit', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('message:edit', {
        teamId: team.id,
        guid: messageGuid,
        body: 'hello again'
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('message:edit', {
        teamId: team.id,
        guid: 'xxx'
      }, function (response) {
        response.error.should.equal('Error: Message (xxx) not found')
        done()
      })
    })
  })

  describe('message:track', function () {
    var eventGuids = []

    after(function (done) {
      var jobs = []
      eventGuids.forEach(function (e) {
        jobs.push(function (next) {
          api.models.Event.destroy({where: {guid: e}}).then(() => {
            next()
          }).catch(next)
        })
      })

      async.series(jobs, done)
    })

    it('succeeds (read, json)', function (done) {
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'read'
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.event.guid)
        eventGuids.push(response.event.guid)
        done()
      })
    })

    it('succeeds (act, json)', function (done) {
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'act'
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.event.guid)
        eventGuids.push(response.event.guid)
        done()
      })
    })

    it('succeeds (read, html)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'read'
      }, function (response, res) {
        should.not.exist(response.error)
        should.exist(response.event.guid)
        res.statusCode.should.equal(200)
        eventGuids.push(response.event.guid)
        done()
      })
    })

    it('succeeds (act, html)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'act'
      }, function (response, res) {
        should.not.exist(response.error)
        should.exist(response.event.guid)
        res.statusCode.should.equal(200)
        eventGuids.push(response.event.guid)
        done()
      })
    })

    it('succeeds (read, gif)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track.gif', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'read'
      }, function (response, res) {
        response.toString().indexOf('GIF').should.equal(0)
        res.statusCode.should.equal(200)
        res.headers['x-powered-by'].should.equal('MessageBot')
        res.headers['content-type'].should.equal('image/gif')
        done()
      })
    })

    it('succeeds (act, gif)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/message/track.gif', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'act'
      }, function (response, res) {
        response.toString().indexOf('GIF').should.equal(0)
        res.statusCode.should.equal(200)
        res.headers['x-powered-by'].should.equal('MessageBot')
        res.headers['content-type'].should.equal('image/gif')
        done()
      })
    })

    it('succeeds (message timestamps updated)', function (done) {
      api.specHelper.runAction('message:view', {
        teamId: team.id,
        guid: messageGuid
      }, function (response) {
        should.not.exist(response.error)
        response.message.guid.should.equal(messageGuid)
        should.exist(response.message.readAt)
        should.exist(response.message.actedAt)
        done()
      })
    })

    it('fails (bad verb)', function (done) {
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: messageGuid,
        verb: 'did-it'
      }, function (response) {
        response.error.should.equal('Error: verb not allowed')
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('message:track', {
        teamId: team.id,
        guid: 'a-fake-guid',
        verb: 'act'
      }, function (response) {
        response.error.should.equal('Error: Message (a-fake-guid) not found')
        done()
      })
    })
  })

  describe('messages:search', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'messages:search', {
        searchKeys: ['personGuid'],
        searchValues: ['messagesTestPersonGuid'],
        from: 0,
        size: 1
      }, function (response) {
        should.not.exist(response.error)
        response.total.should.equal(1)
        response.messages.length.should.equal(1)
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('people:search', {
        searchKeys: ['personGuid'],
        searchValues: ['messagesTestPersonGuid']
      }, function (response) {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('messages:aggregation', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'messages:aggregation', {
        searchKeys: ['personGuid'],
        searchValues: ['messagesTestPersonGuid']
      }, function (response) {
        should.not.exist(response.error)
        Object.keys(response.aggregations).length.should.equal(1)
        var key = Object.keys(response.aggregations)[0]
        var date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.aggregations[key].should.deepEqual({smtp: 1})
        done()
      })
    })

    it('fails (not logged in)', function (done) {
      api.specHelper.runAction('messages:aggregation', {
        searchKeys: ['personGuid'],
        searchValues: ['messagesTestPersonGuid']
      }, function (response) {
        response.error.should.equal('Error: Please log in to continue')
        done()
      })
    })
  })

  describe('message:delete', function () {
    it('succeeds', function (done) {
      api.specHelper.runAction('message:delete', {
        teamId: team.id,
        guid: messageGuid
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      api.specHelper.runAction('message:delete', {
        teamId: team.id,
        guid: messageGuid
      }, function (response) {
        response.error.should.equal('Error: Message (' + messageGuid + ') not found')
        done()
      })
    })
  })
})
