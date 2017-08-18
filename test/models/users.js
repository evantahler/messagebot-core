const should = require('should') // eslint-disable-line
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api
let user

describe('models:users', () => {
  beforeEach(() => { api = specHelper.api })

  afterEach((done) => {
    if (user.isNewRecord === false) {
      user.destroy().then(() => { done() })
    } else {
      done()
    }
  })

  it('can create new users with valid params', (done) => {
    user = api.models.User.build({
      teamGuid: 1,
      email: 'a@b.com',
      personGuid: Math.random(),
      passwordHash: 'xxx',
      firstName: 'fname',
      lastName: 'lname',
      role: 'admin'
    })

    user.save().then(() => {
      api.models.User.findOne({where: {email: 'a@b.com'}}).then((user) => {
        user.email.should.equal('a@b.com')
        done()
      })
    })
  })

  it('will not create new users with invalid params (missing requirement)', (done) => {
    user = api.models.User.build({
      teamGuid: 1,
      passwordHash: 'xxx',
      lastName: 'lname'
    })

    user.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.equal(3)
      errors.errors[0].message.should.equal('email cannot be null')
      errors.errors[1].message.should.equal('personGuid cannot be null')
      errors.errors[2].message.should.equal('firstName cannot be null')
      done()
    })
  })

  it('will not create new users with invalid params (duplicate key)', (done) => {
    user = api.models.User.build({
      teamGuid: 1,
      email: 'admin@localhost.com',
      personGuid: Math.random(),
      passwordHash: 'xxx',
      firstName: 'fname',
      lastName: 'lname',
      role: 'admin'
    })

    user.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.equal(1)
      errors.errors[0].message.should.match(/must be unique/)
      done()
    })
  })

  it('will not create new users with invalid params (bad role)', (done) => {
    user = api.models.User.build({
      teamGuid: 1,
      email: 'admin5@localhost.com',
      personGuid: Math.random(),
      passwordHash: 'xxx',
      firstName: 'fname',
      lastName: 'lname',
      role: 'bacon'
    })

    user.save().then(() => {
      throw new Error('should not get here')
    }).catch((errors) => {
      errors.errors.length.should.equal(1)
      errors.errors[0].message.should.equal('role is invalid')
      done()
    })
  })

  it('passwords can be checked (success)', (done) => {
    user = api.models.User.build({
      teamGuid: 1,
      personGuid: Math.random(),
      email: 'aaa@b.com',
      firstName: 'fname',
      lastName: 'lname',
      role: 'admin'
    })

    user.updatePassword('password', (error) => {
      should.not.exist(error)
      user.save().then(() => {
        user.checkPassword('password', (error, match) => {
          should.not.exist(error)
          match.should.equal(true)
          done()
        })
      })
    })
  })

  it('passwords can be checked (failure)', (done) => {
    user = api.models.User.build({
      teamGuid: 1,
      personGuid: Math.random(),
      email: 'bbb@b.com',
      firstName: 'fname',
      lastName: 'lname',
      role: 'admin'
    })

    user.updatePassword('password', (error) => {
      should.not.exist(error)
      user.save().then(() => {
        user.checkPassword('wrongPassword', (error, match) => {
          should.not.exist(error)
          match.should.equal(false)
          done()
        })
      })
    })
  })
})
