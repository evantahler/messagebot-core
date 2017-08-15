var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api
var setting

describe('models:settings', () => {
  beforeEach(() => { api = specHelper.api })

  afterEach((done) => {
    if (setting.isNewRecord === false) {
      setting.destroy().then(() => { done() })
    } else {
      done()
    }
  })

  it('can create a new setting with valid params', (done) => {
    setting = api.models.Setting.build({
      teamId: 1,
      key: 'some:key',
      value: 'abc123',
      description: 'this is a test key'
    })

    setting.save().then(() => {
      api.models.Setting.findOne({where: {teamId: 1, key: 'some:key'}}).then((setting) => {
        setting.value.should.equal('abc123')
        done()
      })
    })
  })

  it('will not create a new setting with invalid params (missing requirement)', (done) => {
    setting = api.models.Setting.build({
      teamId: 1
    })

    setting.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.be.above(2)
      errors.errors[0].message.should.equal('key cannot be null')
      errors.errors[1].message.should.equal('value cannot be null')
      errors.errors[2].message.should.equal('description cannot be null')
      done()
    })
  })

  it('will not create a new setting with invalid params (duplicate key)', (done) => {
    setting = api.models.Setting.build({
      teamId: 1,
      key: 'some:key',
      value: 'abc123',
      description: 'this is a test key'
    })

    setting.save().then(() => {
      var otherSetting = api.models.Setting.build({
        teamId: 1,
        key: 'some:key',
        value: 'abc123',
        description: 'this is a test key'
      })

      otherSetting.save().then(() => {
        throw new Error('should not get here')
      }).catch((errors) => {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    })
  })
})
