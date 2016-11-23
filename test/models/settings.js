var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api
var setting

describe('models:settings', function () {
  beforeEach(function () { api = specHelper.api })

  afterEach(function (done) {
    if (setting.isNewRecord === false) {
      setting.destroy().then(function () { done() })
    } else {
      done()
    }
  })

  it('can create a new setting with valid params', function (done) {
    setting = api.models.setting.build({
      teamId: 1,
      key: 'some:key',
      value: 'abc123',
      description: 'this is a test key'
    })

    setting.save().then(function () {
      api.models.setting.findOne({where: {teamId: 1, key: 'some:key'}}).then(function (setting) {
        setting.value.should.equal('abc123')
        done()
      })
    })
  })

  it('will not create a new setting with invalid params (missing requirement)', function (done) {
    setting = api.models.setting.build({
      teamId: 1
    })

    setting.save().then(function () {
      throw new Error('should not get here')
    }).catch(function (errors) {
      errors.errors.length.should.be.above(2)
      errors.errors[0].message.should.equal('key cannot be null')
      errors.errors[1].message.should.equal('value cannot be null')
      errors.errors[2].message.should.equal('description cannot be null')
      done()
    })
  })

  it('will not create a new setting with invalid params (duplicate key)', function (done) {
    setting = api.models.setting.build({
      teamId: 1,
      key: 'some:key',
      value: 'abc123',
      description: 'this is a test key'
    })

    setting.save().then(function () {
      var otherSetting = api.models.setting.build({
        teamId: 1,
        key: 'some:key',
        value: 'abc123',
        description: 'this is a test key'
      })

      otherSetting.save().then(function () {
        throw new Error('should not get here')
      }).catch(function (errors) {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    })
  })
})
