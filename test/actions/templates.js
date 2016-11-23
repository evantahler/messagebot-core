var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api
var templateId

describe('actions:template', function () {
  beforeEach(function () { api = specHelper.api })

  before(function (done) { specHelper.truncate('templates', done) })
  after(function (done) { specHelper.truncate('templates', done) })

  describe('template:create', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'template:create', {
        name: 'test template',
        description: 'test template',
        template: '<h1>Hello, {{ person.data.firstName }}</h1>'
      }, function (response) {
        should.not.exist(response.error)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('test template')
        templateId = response.template.id
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:create', {
        name: 'test template',
        description: 'test template',
        template: '<h1>Hello, {{ data.firstName }}</h1>'
      }, function (response) {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:create', {
        name: 'test template',
        template: '<h1>Hello, {{ data.firstName }}</h1>'
      }, function (response) {
        response.error.should.equal('Error: description is a required parameter for this action')
        done()
      })
    })
  })

  describe('template:view', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'template:view', {
        templateId: templateId
      }, function (response) {
        should.not.exist(response.error)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('test template')
        done()
      })
    })

    it('fails (not found)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:view', {
        templateId: 999
      }, function (response) {
        response.error.should.equal('Error: template not found')
        done()
      })
    })
  })

  describe('template:copy', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateId: templateId,
        name: 'new template'
      }, function (response) {
        should.not.exist(response.error)
        response.template.id.should.not.equal(templateId)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('new template')
        done()
      })
    })

    it('fails (uniqueness param)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateId: templateId,
        name: 'test template'
      }, function (response) {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateId: templateId
      }, function (response) {
        response.error.should.equal('Error: name is a required parameter for this action')
        done()
      })
    })
  })

  describe('template:edit', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'template:edit', {
        templateId: templateId,
        name: 'a better template name'
      }, function (response) {
        should.not.exist(response.error)
        response.template.name.should.equal('a better template name')
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:edit', {
        templateId: templateId,
        name: 'new template'
      }, function (response) {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })
  })

  describe('template:render', function (done) {
    var person
    var team

    before(function (done) {
      api.models.Team.findOne().then(function (_team) {
        team = _team
        done()
      }).catch(done)
    })

    before(function (done) {
      person = new api.models.Person(team)
      person.data.source = 'tester'
      person.data.device = 'phone'
      person.data.listOptOuts = []
      person.data.globalOptOut = false
      person.data.data = {
        firstName: 'fname',
        lastName: 'lame',
        email: 'fake@faker.fake'
      }

      person.create(function () {
        person.hydrate(done)
      })
    })

    after(function (done) { person.del(done) })

    it('succeeds (view; specHelper)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:render', {
        templateId: templateId,
        personGuid: person.data.guid
      }, function (response) {
        should.not.exist(response.error)
        response.html.should.equal('<h1>Hello, fname</h1>')
        response.view.person.data.firstName.should.equal('fname')
        response.view.template.id.should.equal(templateId)
        done()
      })
    })

    it('succeeds (view; web request)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/template/render', {
        templateId: templateId,
        personGuid: person.data.guid
      }, function (response, res) {
        should.not.exist(response.error)
        response.html.should.equal('<h1>Hello, fname</h1>')
        response.view.person.data.firstName.should.equal('fname')
        response.view.template.id.should.equal(templateId)
        done()
      })
    })

    it('succeeds (rendered HTML; web request)', function (done) {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/template/render.html', {
        templateId: templateId,
        personGuid: person.data.guid
      }, function (response, res) {
        response.should.equal('<h1>Hello, fname</h1>')
        res.statusCode.should.equal(200)
        res.headers['x-powered-by'].should.equal('MessageBot')
        res.headers['content-type'].should.equal('text/html')
        done()
      })
    })
  })

  describe('templates:list', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'templates:list', {}, function (response) {
        should.not.exist(response.error)
        response.templates.length.should.equal(2)
        response.templates[0].name.should.equal('a better template name')
        response.templates[1].name.should.equal('new template')
        done()
      })
    })
  })

  describe('templates:folders', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'templates:folders', {}, function (response) {
        should.not.exist(response.error)
        response.folders.length.should.equal(1)
        response.folders.should.deepEqual(['default'])
        done()
      })
    })
  })

  describe('template:delete', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'template:delete', {
        templateId: templateId
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      specHelper.requestWithLogin(email, password, 'template:delete', {
        templateId: templateId
      }, function (response) {
        response.error.should.equal('Error: template not found')
        done()
      })
    })
  })
})
