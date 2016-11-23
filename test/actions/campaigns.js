var should = require('should')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api // eslint-disable-line 
var campaignId

describe('actions:campaign', function () {
  beforeEach(function () { api = specHelper.api })

  before(function (done) { specHelper.truncate('campaigns', done) })
  after(function (done) { specHelper.truncate('campaigns', done) })

  describe('campaign:create', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:create', {
        name: 'test campaign',
        description: 'test campaign',
        listId: 1,
        templateId: 1,
        type: 'simple',
        transport: 'smtp'
      }, function (response) {
        should.not.exist(response.error)
        response.campaign.folder.should.equal('default')
        response.campaign.name.should.equal('test campaign')
        campaignId = response.campaign.id
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:create', {
        name: 'test campaign',
        description: 'test campaign',
        listId: 1,
        templateId: 1,
        type: 'simple',
        transport: 'smtp'
      }, function (response) {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:create', {
        name: 'test campaign',
        listId: 1,
        templateId: 1,
        type: 'simple',
        transport: 'smtp'
      }, function (response) {
        response.error.should.equal('Error: description is a required parameter for this action')
        done()
      })
    })
  })

  describe('campaign:view', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:view', {
        campaignId: campaignId
      }, function (response) {
        should.not.exist(response.error)
        response.campaign.folder.should.equal('default')
        response.campaign.name.should.equal('test campaign')
        done()
      })
    })

    it('fails (not found)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:view', {
        campaignId: 999
      }, function (response) {
        response.error.should.equal('Error: campaign not found')
        done()
      })
    })
  })

  describe('campaign:copy', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:copy', {
        campaignId: campaignId,
        name: 'new campaign'
      }, function (response) {
        should.not.exist(response.error)
        response.campaign.id.should.not.equal(campaignId)
        response.campaign.folder.should.equal('default')
        response.campaign.name.should.equal('new campaign')
        done()
      })
    })

    it('fails (uniqueness param)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:copy', {
        campaignId: campaignId,
        name: 'test campaign'
      }, function (response) {
        response.error.should.match(/must be unique/)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:copy', {
        campaignId: campaignId
      }, function (response) {
        response.error.should.equal('Error: name is a required parameter for this action')
        done()
      })
    })
  })

  describe('campaign:edit', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:edit', {
        campaignId: campaignId,
        name: 'a better campaign name'
      }, function (response) {
        should.not.exist(response.error)
        response.campaign.name.should.equal('a better campaign name')
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:edit', {
        campaignId: campaignId,
        name: 'new campaign'
      }, function (response) {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })
  })

  describe('campaign:stats', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:stats', {
        campaignId: campaignId
      }, function (response) {
        should.not.exist(response.error)
        should.exist(response.totals)
        should.exist(response.sentAt)
        should.exist(response.readAt)
        should.exist(response.actedAt)
        done()
      })
    })
  })

  describe('campaigns:types', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaigns:types', {}, function (response) {
        should.not.exist(response.error)
        response.validTypes.should.deepEqual(['simple', 'recurring', 'trigger'])
        done()
      })
    })
  })

  describe('campaigns:list', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaigns:list', {}, function (response) {
        should.not.exist(response.error)
        response.campaigns.length.should.equal(2)
        response.campaigns[0].name.should.equal('a better campaign name')
        response.campaigns[1].name.should.equal('new campaign')
        done()
      })
    })
  })

  describe('campaigns:folders', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaigns:folders', {}, function (response) {
        should.not.exist(response.error)
        response.folders.length.should.equal(1)
        response.folders.should.deepEqual(['default'])
        done()
      })
    })
  })

  describe('campaign:delete', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:delete', {
        campaignId: campaignId
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      specHelper.requestWithLogin(email, password, 'campaign:delete', {
        campaignId: campaignId
      }, function (response) {
        response.error.should.equal('Error: campaign not found')
        done()
      })
    })
  })
})
