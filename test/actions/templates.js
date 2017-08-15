var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api
var templateId

describe('actions:template', () => {
  beforeEach(() => { api = specHelper.api })

  before((done) => { specHelper.truncate('templates', done) })
  after((done) => { specHelper.truncate('templates', done) })

  describe('template:create', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:create', {
        name: 'test template',
        description: 'test template',
        template: '<h1>Hello, {{ person.data.firstName }}</h1>'
      }, (response) => {
        should.not.exist(response.error)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('test template')
        templateId = response.template.id
        done()
      })
    })

    it('fails (uniqueness failure)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:create', {
        name: 'test template',
        description: 'test template',
        template: '<h1>Hello, {{ data.firstName }}</h1>'
      }, (response) => {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:create', {
        name: 'test template',
        template: '<h1>Hello, {{ data.firstName }}</h1>'
      }, (response) => {
        response.error.should.equal('Error: description is a required parameter for this action')
        done()
      })
    })
  })

  describe('template:view', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:view', {
        templateId: templateId
      }, (response) => {
        should.not.exist(response.error)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('test template')
        done()
      })
    })

    it('fails (not found)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:view', {
        templateId: 999
      }, (response) => {
        response.error.should.equal('Error: template not found')
        done()
      })
    })
  })

  describe('template:copy', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateId: templateId,
        name: 'new template'
      }, (response) => {
        should.not.exist(response.error)
        response.template.id.should.not.equal(templateId)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('new template')
        done()
      })
    })

    it('fails (uniqueness param)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateId: templateId,
        name: 'test template'
      }, (response) => {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateId: templateId
      }, (response) => {
        response.error.should.equal('Error: name is a required parameter for this action')
        done()
      })
    })
  })

  describe('template:edit', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:edit', {
        templateId: templateId,
        name: 'a better template name'
      }, (response) => {
        should.not.exist(response.error)
        response.template.name.should.equal('a better template name')
        done()
      })
    })

    it('fails (uniqueness failure)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:edit', {
        templateId: templateId,
        name: 'new template'
      }, (response) => {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })
  })

  describe('template:render', (done) => {
    var person
    var team

    before((done) => {
      api.models.Team.findOne().then((_team) => {
        team = _team
        done()
      }).catch(done)
    })

    before((done) => {
      person = api.models.Person.build()
      person.source = 'tester'
      person.teamId = team.id
      person.device = 'phone'
      person.listOptOuts = []
      person.globalOptOut = false
      person.save().then(() => {
        var collection = [
          {personGuid: person.guid, teamId: team.id, key: 'firstName', value: 'fname'},
          {personGuid: person.guid, teamId: team.id, key: 'lastName', value: 'lame'},
          {personGuid: person.guid, teamId: team.id, key: 'email', value: 'fake@faker.fake'}
        ]

        api.models.PersonData.bulkCreate(collection).then(() => {
          done()
        }).catch(done)
      }).catch(done)
    })

    after((done) => {
      person.destroy().then(() => {
        done()
      }).catch(done)
    })

    it('succeeds (view; specHelper)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:render', {
        templateId: templateId,
        personGuid: person.guid
      }, (response) => {
        should.not.exist(response.error)
        response.html.should.equal('<h1>Hello, fname</h1>')
        response.view.person.data.firstName.should.equal('fname')
        response.view.template.id.should.equal(templateId)
        done()
      })
    })

    it('succeeds (view; web request)', (done) => {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/template/render', {
        templateId: templateId,
        personGuid: person.guid
      }, (response, res) => {
        should.not.exist(response.error)
        response.html.should.equal('<h1>Hello, fname</h1>')
        response.view.person.data.firstName.should.equal('fname')
        response.view.template.id.should.equal(templateId)
        done()
      })
    })

    it('succeeds (rendered HTML; web request)', (done) => {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/template/render.html', {
        templateId: templateId,
        personGuid: person.guid
      }, (response, res) => {
        response.should.equal('<h1>Hello, fname</h1>')
        res.statusCode.should.equal(200)
        res.headers['x-powered-by'].should.equal('MessageBot')
        res.headers['content-type'].should.equal('text/html')
        done()
      })
    })
  })

  describe('templates:list', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'templates:list', {}, (response) => {
        should.not.exist(response.error)
        response.templates.length.should.equal(2)
        response.templates[0].name.should.equal('a better template name')
        response.templates[1].name.should.equal('new template')
        done()
      })
    })
  })

  describe('templates:folders', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'templates:folders', {}, (response) => {
        should.not.exist(response.error)
        response.folders.length.should.equal(1)
        response.folders.should.deepEqual(['default'])
        done()
      })
    })
  })

  describe('template:delete', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:delete', {
        templateId: templateId
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:delete', {
        templateId: templateId
      }, (response) => {
        response.error.should.equal('Error: template not found')
        done()
      })
    })
  })
})
