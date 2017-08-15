const should = require('should') // eslint-disable-line
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let campaign
let api

describe('models:campaigns', () => {
  beforeEach(() => { api = specHelper.api })

  afterEach((done) => {
    if (campaign.isNewRecord === false) {
      campaign.destroy().then(() => { done() })
    } else {
      done()
    }
  })

  it('can create new campaign with valid params', (done) => {
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

    campaign.save().then(() => {
      api.models.Campaign.findOne({where: {name: 'my campaign'}}).then((campaign) => {
        campaign.folder.should.equal('default')
        done()
      })
    })
  })

  it('will not create new campaign with invalid params (missing requirement)', (done) => {
    campaign = api.models.Campaign.build({
      teamId: 1,
      type: 'simple',
      folder: 'default',
      transport: 'smtp',
      listId: 1,
      templateId: 1
    })

    campaign.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.be.above(1)
      errors.errors[0].message.should.equal('name cannot be null')
      errors.errors[1].message.should.equal('description cannot be null')
      done()
    })
  })

  it('will not create new campaigns with invalid params (duplicate key)', (done) => {
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

    campaign.save().then(() => {
      let otherCampaign = api.models.Campaign.build({
        teamId: 1,
        name: 'my campaign',
        description: 'my campaign',
        type: 'simple',
        folder: 'default',
        transport: 'smtp',
        listId: 1,
        templateId: 1
      })

      otherCampaign.save().then(() => {
        throw new Error('should not get here')
      }).catch((errors) => {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    })
  })

  it('will not create new campaigns with invalid params (bad type)', (done) => {
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

    campaign.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.be.above(0)
      errors.errors[0].message.should.equal('type is invalid')
      done()
    })
  })

  it('returns valid types', (done) => {
    campaign = api.models.Campaign.build()
    campaign.validTypes().should.deepEqual(['simple', 'recurring', 'trigger'])
    done()
  })
})
