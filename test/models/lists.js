var should = require('should') // eslint-disable-line
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var api
var list

describe('models:lists', function () {
  beforeEach(function () { api = specHelper.api })

  afterEach(function (done) {
    if (list.isNewRecord === false) {
      list.destroy().then(function () { done() })
    } else {
      done()
    }
  })

  it('can create new list with valid params', function (done) {
    list = api.models.List.build({
      teamId: 1,
      name: 'my list',
      description: 'my list',
      type: 'dynamic',
      folder: 'default'
    })

    list.save().then(function () {
      api.models.List.findOne({where: {name: 'my list'}}).then(function (list) {
        list.folder.should.equal('default')
        done()
      })
    })
  })

  it('will not create new list with invalid params (missing requirement)', function (done) {
    list = api.models.List.build({
      teamId: 1,
      description: 'my list',
      folder: 'default'
    })

    list.save().then(function () {
      throw new Error('should not get here')
    }).catch(function (errors) {
      errors.errors.length.should.be.above(1)
      errors.errors[0].message.should.equal('name cannot be null')
      errors.errors[1].message.should.equal('type cannot be null')
      done()
    })
  })

  it('will not create new lists with invalid params (duplicate key)', function (done) {
    list = api.models.List.build({
      teamId: 1,
      name: 'my list',
      description: 'my list',
      type: 'dynamic',
      folder: 'default'
    })

    list.save().then(function () {
      var otherList = api.models.List.build({
        teamId: 1,
        name: 'my list',
        description: 'my list',
        type: 'dynamic',
        folder: 'default'
      })

      otherList.save().then(function () {
        throw new Error('should not get here')
      }).catch(function (errors) {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    })
  })

  it('will not create new lists with invalid params (bad type)', function (done) {
    list = api.models.List.build({
      teamId: 1,
      name: 'my list',
      description: 'my list',
      type: 'wacky',
      folder: 'default'
    })

    list.save().then(function () {
      throw new Error('should not get here')
    }).catch(function (errors) {
      errors.errors.length.should.be.above(0)
      errors.errors[0].message.should.equal('type is invalid')
      done()
    })
  })

  it('returns valid types', function (done) {
    list = api.models.List.build()
    list.validTypes().should.deepEqual(['dynamic', 'static'])
    done()
  })
})
