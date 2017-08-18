const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let email = 'admin@localhost.com'
let password = 'password'
let api
let templateGuid

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
        templateGuid = response.template.id
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
        templateGuid: templateGuid
      }, (response) => {
        should.not.exist(response.error)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('test template')
        done()
      })
    })

    it('fails (not found)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:view', {
        templateGuid: 999
      }, (response) => {
        response.error.should.equal('Error: template not found')
        done()
      })
    })
  })

  describe('template:copy', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateGuid: templateGuid,
        name: 'new template'
      }, (response) => {
        should.not.exist(response.error)
        response.template.id.should.not.equal(templateGuid)
        response.template.folder.should.equal('default')
        response.template.name.should.equal('new template')
        done()
      })
    })

    it('fails (uniqueness param)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateGuid: templateGuid,
        name: 'test template'
      }, (response) => {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:copy', {
        templateGuid: templateGuid
      }, (response) => {
        response.error.should.equal('Error: name is a required parameter for this action')
        done()
      })
    })
  })

  describe('template:edit', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'template:edit', {
        templateGuid: templateGuid,
        name: 'a better template name'
      }, (response) => {
        should.not.exist(response.error)
        response.template.name.should.equal('a better template name')
        done()
      })
    })

    it('fails (uniqueness failure)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:edit', {
        templateGuid: templateGuid,
        name: 'new template'
      }, (response) => {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })
  })

  describe('template:render', (done) => {
    let person
    let team

    before((done) => {
      api.models.Team.findOne().then((_team) => {
        team = _team
        done()
      }).catch(done)
    })

    before((done) => {
      person = api.models.Person.build()
      person.source = 'tester'
      person.teamGuid = team.guid
      person.device = 'phone'
      person.listOptOuts = []
      person.globalOptOut = false
      person.save().then(() => {
        let collection = [
          {personGuid: person.guid, teamGuid: team.guid, key: 'firstName', value: 'fname'},
          {personGuid: person.guid, teamGuid: team.guid, key: 'lastName', value: 'lame'},
          {personGuid: person.guid, teamGuid: team.guid, key: 'email', value: 'fake@faker.fake'}
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
        templateGuid: templateGuid,
        personGuid: person.guid
      }, (response) => {
        should.not.exist(response.error)
        response.html.should.equal('<h1>Hello, fname</h1>')
        response.view.person.data.firstName.should.equal('fname')
        response.view.template.id.should.equal(templateGuid)
        done()
      })
    })

    it('succeeds (view; web request)', (done) => {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/template/render', {
        templateGuid: templateGuid,
        personGuid: person.guid
      }, (response, res) => {
        should.not.exist(response.error)
        response.html.should.equal('<h1>Hello, fname</h1>')
        response.view.person.data.firstName.should.equal('fname')
        response.view.template.id.should.equal(templateGuid)
        done()
      })
    })

    it('succeeds (rendered HTML; web request)', (done) => {
      specHelper.WebRequestWithLogin(email, password, 'get', '/api/template/render.html', {
        templateGuid: templateGuid,
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
        templateGuid: templateGuid
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', (done) => {
      specHelper.requestWithLogin(email, password, 'template:delete', {
        templateGuid: templateGuid
      }, (response) => {
        response.error.should.equal('Error: template not found')
        done()
      })
    })
  })
})
