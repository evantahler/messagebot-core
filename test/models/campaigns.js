var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var campaign
var api

describe('models:campaigns', function () {
  beforeEach(function () { api = specHelper.api })

  afterEach(function (done) {
    if (campaign.isNewRecord === false) {
      campaign.destroy().then(function () { done() })
    } else {
      done()
    }
  })

  it('can create new campaign with valid params', function (done) {
    campaign = api.models.Campaign.build({
      teamId: 1,
      name: 'my campaign',
      description: 'my campaign',
      type: 'simple',
      folder: 'default',
      transport: 'smtp',
      listId: 1,
      templateId: 1
    })

    campaign.save().then(function () {
      api.models.Campaign.findOne({where: {name: 'my campaign'}}).then(function (campaign) {
        campaign.folder.should.equal('default')
        done()
      })
    })
  })

  it('will not create new campaign with invalid params (missing requirement)', function (done) {
    campaign = api.models.Campaign.build({
      teamId: 1,
      type: 'simple',
      folder: 'default',
      transport: 'smtp',
      listId: 1,
      templateId: 1
    })

    campaign.save().then(function () {
      throw new Error('should not get here')
    }).catch(function (errors) {
      errors.errors.length.should.be.above(1)
      errors.errors[0].message.should.equal('name cannot be null')
      errors.errors[1].message.should.equal('description cannot be null')
      done()
    })
  })

  it('will not create new campaigns with invalid params (duplicate key)', function (done) {
    campaign = api.models.Campaign.build({
      teamId: 1,
      name: 'my campaign',
      description: 'my campaign',
      type: 'simple',
      folder: 'default',
      transport: 'smtp',
      listId: 1,
      templateId: 1
    })

    campaign.save().then(function () {
      var otherCampaign = api.models.Campaign.build({
        teamId: 1,
        name: 'my campaign',
        description: 'my campaign',
        type: 'simple',
        folder: 'default',
        transport: 'smtp',
        listId: 1,
        templateId: 1
      })

      otherCampaign.save().then(function () {
        throw new Error('should not get here')
      }).catch(function (errors) {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    })
  })

  it('will not create new campaigns with invalid params (bad type)', function (done) {
    campaign = api.models.Campaign.build({
      teamId: 1,
      name: 'my campaign',
      description: 'my campaign',
      type: 'wacky',
      folder: 'default',
      transport: 'smtp',
      listId: 1,
      templateId: 1
    })

    campaign.save().then(function () {
      throw new Error('should not get here')
    }).catch(function (errors) {
      errors.errors.length.should.be.above(0)
      errors.errors[0].message.should.equal('type is invalid')
      done()
    })
  })

  it('returns valid types', function (done) {
    campaign = api.models.Campaign.build()
    campaign.validTypes().should.deepEqual(['simple', 'recurring', 'trigger'])
    done()
  })
})
