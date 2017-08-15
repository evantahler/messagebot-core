var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api
var team
var campaignId

describe('actions:campaign', () => {
  before(() => { api = specHelper.api })

  before((done) => {
    api.models.Team.findOne().then((_team) => {
      team = _team
      done()
    })
  })

  before((done) => { specHelper.truncate('campaigns', done) })
  after((done) => { specHelper.truncate('campaigns', done) })

  describe('campaign:create', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:create', {
        name: 'test campaign',
        description: 'test campaign',
        listId: 1,
        templateId: 1,
        type: 'simple',
        transport: 'smtp'
      }, (response) => {
        should.not.exist(response.error)
        response.campaign.folder.should.equal('default')
        response.campaign.name.should.equal('test campaign')
        campaignId = response.campaign.id
        done()
      })
    })

    it('fails (uniqueness failure)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:create', {
        name: 'test campaign',
        description: 'test campaign',
        listId: 1,
        templateId: 1,
        type: 'simple',
        transport: 'smtp'
      }, (response) => {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:create', {
        name: 'test campaign',
        listId: 1,
        templateId: 1,
        type: 'simple',
        transport: 'smtp'
      }, (response) => {
        response.error.should.equal('Error: description is a required parameter for this action')
        done()
      })
    })
  })

  describe('campaign:view', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:view', {
        campaignId: campaignId
      }, (response) => {
        should.not.exist(response.error)
        response.campaign.folder.should.equal('default')
        response.campaign.name.should.equal('test campaign')
        done()
      })
    })

    it('fails (not found)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:view', {
        campaignId: 999
      }, (response) => {
        response.error.should.equal('Error: campaign not found')
        done()
      })
    })
  })

  describe('campaign:copy', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:copy', {
        campaignId: campaignId,
        name: 'new campaign'
      }, (response) => {
        should.not.exist(response.error)
        response.campaign.id.should.not.equal(campaignId)
        response.campaign.folder.should.equal('default')
        response.campaign.name.should.equal('new campaign')
        done()
      })
    })

    it('fails (uniqueness param)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:copy', {
        campaignId: campaignId,
        name: 'test campaign'
      }, (response) => {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:copy', {
        campaignId: campaignId
      }, (response) => {
        response.error.should.equal('Error: name is a required parameter for this action')
        done()
      })
    })
  })

  describe('campaign:edit', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:edit', {
        campaignId: campaignId,
        name: 'a better campaign name'
      }, (response) => {
        should.not.exist(response.error)
        response.campaign.name.should.equal('a better campaign name')
        done()
      })
    })

    it('fails (uniqueness failure)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:edit', {
        campaignId: campaignId,
        name: 'new campaign'
      }, (response) => {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })
  })

  describe('campaign:stats', () => {
    before((done) => {
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        personGuid: 'xxx',
        transport: 'smtp',
        campaignId: campaignId,
        body: 'hello',
        view: {},
        sentAt: new Date()
      }, (response) => {
        done()
      })
    })

    before((done) => {
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        personGuid: 'yyy',
        transport: 'smtp',
        campaignId: campaignId,
        body: 'hello',
        view: {},
        sentAt: new Date(),
        readAt: new Date()
      }, (response) => {
        done()
      })
    })

    before((done) => {
      api.specHelper.runAction('message:create', {
        teamId: team.id,
        personGuid: 'zzz',
        transport: 'smtp',
        campaignId: campaignId,
        body: 'hello',
        view: {},
        sentAt: new Date(),
        readAt: new Date(),
        actedAt: new Date()
      }, (response) => {
        done()
      })
    })

    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:stats', {
        campaignId: campaignId
      }, (response) => {
        should.not.exist(response.error)
        response.totals.should.deepEqual({sentAt: 3, readAt: 2, actedAt: 1})

        var key
        var date

        key = Object.keys(response.sentAt[0])[0]
        date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.sentAt[0][key].should.deepEqual({smtp: 3})

        key = Object.keys(response.readAt[0])[0]
        date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.readAt[0][key].should.deepEqual({smtp: 2})

        key = Object.keys(response.actedAt[0])[0]
        date = new Date(key)
        specHelper.dateCompare(date).should.equal(true)
        response.actedAt[0][key].should.deepEqual({smtp: 1})

        done()
      })
    })
  })

  describe('campaigns:types', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaigns:types', {}, (response) => {
        should.not.exist(response.error)
        response.validTypes.should.deepEqual(['simple', 'recurring', 'trigger'])
        done()
      })
    })
  })

  describe('campaigns:list', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaigns:list', {}, (response) => {
        should.not.exist(response.error)
        response.campaigns.length.should.equal(2)
        response.campaigns[0].name.should.equal('a better campaign name')
        response.campaigns[1].name.should.equal('new campaign')
        done()
      })
    })
  })

  describe('campaigns:folders', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaigns:folders', {}, (response) => {
        should.not.exist(response.error)
        response.folders.length.should.equal(1)
        response.folders.should.deepEqual(['default'])
        done()
      })
    })
  })

  describe('campaign:delete', () => {
    it('succeeds', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:delete', {
        campaignId: campaignId
      }, (response) => {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', (done) => {
      specHelper.requestWithLogin(email, password, 'campaign:delete', {
        campaignId: campaignId
      }, (response) => {
        response.error.should.equal('Error: campaign not found')
        done()
      })
    })
  })
})
