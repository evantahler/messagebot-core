const should = require('should') //eslint-disable-line
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api
let template

describe('models:templates', () => {
  beforeEach(() => { api = specHelper.api })

  afterEach((done) => {
    if (template.isNewRecord === false) {
      template.destroy().then(() => { done() })
    } else {
      done()
    }
  })

  it('can create new template with valid params', (done) => {
    template = api.models.Template.build({
      teamId: 1,
      name: 'my template',
      description: 'my template',
      type: 'simple',
      folder: 'default'
    })

    template.save().then(() => {
      api.models.Template.findOne({where: {name: 'my template'}}).then(function (template) {
        template.folder.should.equal('default')
        done()
      })
    })
  })

  it('will not create new template with invalid params (missing requirement)', (done) => {
    template = api.models.Template.build({
      teamId: 1,
      type: 'simple',
      folder: 'default'
    })

    template.save().then(() => {
      throw new Error('should not get here')
    }).catch(function (errors) {
      errors.errors.length.should.be.above(1)
      errors.errors[0].message.should.equal('name cannot be null')
      errors.errors[1].message.should.equal('description cannot be null')
      done()
    })
  })

  it('will not create new templates with invalid params (duplicate key)', (done) => {
    template = api.models.Template.build({
      teamId: 1,
      name: 'my template',
      description: 'my template',
      type: 'simple',
      folder: 'default'
    })

    template.save().then(() => {
      let otherTemplate = api.models.Template.build({
        teamId: 1,
        name: 'my template',
        description: 'my template',
        type: 'simple',
        folder: 'default'
      })

      otherTemplate.save().then(() => {
        throw new Error('should not get here')
      }).catch((errors) => {
        errors.errors.length.should.be.above(0)
        errors.errors[0].message.should.match(/must be unique/)
        done()
      })
    }).catch(done)
  })

  describe('tempalte#render', () => {
    // See tests/integartion/template
  })
})
