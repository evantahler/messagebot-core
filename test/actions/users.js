var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../specHelper'))
var email = 'admin@localhost.com'
var password = 'password'
var api
var team
var userId
var otherUserId

describe('actions:user', function () {
  before(function () { api = specHelper.api })

  before(function (done) {
    api.models.Team.findOne().then(function (_team) {
      team = _team
      done()
    })
  })

  var cleanUsersTable = function (callback) {
    var jobs = []
    api.models.User.findAll().then(function (users) {
      users.forEach(function (user) {
        if (user.email !== 'admin@localhost.com') {
          jobs.push(function (next) {
            api.models.Person.destroy({where: {guid: user.personGuid}}).then(function () {
              next()
            }).catch(next)
          })

          jobs.push(function (next) {
            api.models.PersonData.destroy({where: {personGuid: user.personGuid}}).then(function () {
              next()
            }).catch(next)
          })

          jobs.push(function (next) {
            user.destroy().then(function () { next() }).catch(next)
          })
        }
      })

      async.series(jobs, function (error) {
        if (error) { return callback(error) }
        callback()
      })
    }).catch(callback)
  }

  before(function (done) { cleanUsersTable(done) })
  after(function (done) { cleanUsersTable(done) })

  describe('user:create', function () {
    it('succeeds (admin)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:create', {
        email: 'user@fake.com',
        firstName: 'user',
        lastName: 'user',
        password: 'abc123',
        role: 'admin'
      }, function (response) {
        should.not.exist(response.error)
        response.user.email.should.equal('user@fake.com')
        response.user.role.should.equal('admin')
        should.not.exist(response.user.pasword)
        userId = response.user.id
        done()
      })
    })

    it('creates a person with each uesr', function (done) {
      api.models.User.find({where: {id: userId}}).then(function (user) {
        api.models.Person.find({where: {guid: user.personGuid}, include: api.models.PersonData}).then(function (person) {
          person.source.should.equal('admin')
          person.personData.length.should.equal(4)
          person.personData.forEach(function (pd) {
            if (pd.key === 'firstName') { pd.value.should.equal('user') }
            if (pd.key === 'email') { pd.value.should.equal('user@fake.com') }
          })
          done()
        }).catch(done)
      }).catch(done)
    })

    it('succeeds (other role)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:create', {
        email: 'otherUser@fake.com',
        firstName: 'user',
        lastName: 'user',
        password: 'abc123',
        role: 'marketer'
      }, function (response) {
        should.not.exist(response.error)
        response.user.email.should.equal('otherUser@fake.com')
        response.user.role.should.equal('marketer')
        should.not.exist(response.user.pasword)
        otherUserId = response.user.id
        done()
      })
    })

    it('succeeds (creates the proper person)', function (done) {
      api.models.User.find({where: {id: userId}}).then(function (user) {
        should.exist(user)
        api.models.Person.find({where: {guid: user.personGuid}, include: api.models.PersonData}).then(function (person) {
          person.source.should.equal('admin')
          person.personData.length.should.equal(4)
          person.personData.forEach(function (pd) {
            if (pd.key === 'firstName') { pd.value.should.equal(user.firstName) }
            if (pd.key === 'lastName') { pd.value.should.equal(user.lastName) }
            if (pd.key === 'email') { pd.value.should.equal(user.email) }
          })
          done()
        }).catch(done)
      }).catch(done)
    })

    it('fails (only admin roles can create other uers)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:create', {
        email: 'someoneElse@fake.com',
        firstName: 'user',
        lastName: 'user',
        password: 'abc123',
        role: 'admin'
      }, function (response) {
        response.error.should.equal('Error: admin role requried')
        done()
      })
    })

    it('fails (uniqueness failure)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:create', {
        email: 'user@fake.com',
        firstName: 'user',
        lastName: 'user',
        password: 'abc123',
        role: 'admin'
      }, function (response) {
        response.error.should.match(/Validation error/)
        done()
      })
    })

    it('fails (missing param)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:create', {
        firstName: 'user',
        lastName: 'user',
        password: 'abc123',
        role: 'admin'
      }, function (response) {
        response.error.should.equal('Error: email is a required parameter for this action')
        done()
      })
    })
  })

  describe('user:view', function () {
    it('succeeds (admin, self)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:view', {}, function (response) {
        should.not.exist(response.error)
        response.user.email.should.equal('admin@localhost.com')
        done()
      })
    })

    it('succeeds (admin, other user)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:view', {
        userId: userId
      }, function (response) {
        should.not.exist(response.error)
        response.user.email.should.equal('user@fake.com')
        done()
      })
    })

    it('succeeds (non-admin, self)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:view', {}, function (response) {
        should.not.exist(response.error)
        response.user.email.should.equal('otherUser@fake.com')
        done()
      })
    })

    it('fails (non-admin, other user)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:view', {
        userId: userId
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('fails (not found)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:view', {
        userId: 999
      }, function (response) {
        response.error.should.equal('Error: user not found')
        done()
      })
    })
  })

  describe('user:edit', function () {
    it('succeeds (admin, self)', function (done) {
      specHelper.requestWithLogin('user@fake.com', 'abc123', 'user:edit', {
        firstName: 'new first name'
      }, function (response) {
        should.not.exist(response.error)
        response.user.firstName.should.equal('new first name')
        done()
      })
    })

    it('edits the person as well', function (done) {
      api.models.User.find({where: {id: userId}}).then(function (user) {
        should.exist(user)
        api.models.Person.find({where: {guid: user.personGuid}, include: api.models.PersonData}).then(function (person) {
          person.source.should.equal('admin')
          person.personData.length.should.equal(4)
          person.personData.forEach(function (pd) {
            if (pd.key === 'firstName') { pd.value.should.equal('new first name') }
            if (pd.key === 'lastName') { pd.value.should.equal('user') }
          })
          done()
        }).catch(done)
      }).catch(done)
    })

    it('succeeds (admin, other user)', function (done) {
      specHelper.requestWithLogin('user@fake.com', 'abc123', 'user:edit', {
        userId: otherUserId,
        firstName: 'new first name'
      }, function (response) {
        should.not.exist(response.error)
        response.user.firstName.should.equal('new first name')
        done()
      })
    })

    it('succeeds (non-admin, sef)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:edit', {
        firstName: 'some other first name'
      }, function (response) {
        should.not.exist(response.error)
        response.user.firstName.should.equal('some other first name')
        done()
      })
    })

    it('succeeds (non-admin, can change own password)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:edit', {
        password: 'xyz123'
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('succeeds (admin, can change other users password)', function (done) {
      specHelper.requestWithLogin('user@fake.com', 'abc123', 'user:edit', {
        password: 'abc123',
        userId: otherUserId
      }, function (response) {
        should.not.exist(response.error)
        done()
      })
    })

    it('succeeds (admin, can change other users role)', function (done) {
      specHelper.requestWithLogin('user@fake.com', 'abc123', 'user:edit', {
        role: 'analyst',
        userId: otherUserId
      }, function (response) {
        should.not.exist(response.error)
        response.user.role.should.equal('analyst')
        done()
      })
    })

    it('fails (non-admin, can change other users password)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:edit', {
        password: 'xyz123',
        userId: userId
      }, function (response) {
        response.error.should.equal('Error: only admin role can modify other users')
        done()
      })
    })

    it('fails (non-admin, self, change role)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:edit', {
        role: 'admin'
      }, function (response) {
        response.error.should.equal('Error: only admin role can modify role')
        done()
      })
    })

    it('fails (non-admin, other user, change role)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:edit', {
        role: 'admin',
        userId: userId
      }, function (response) {
        response.error.should.equal('Error: only admin role can modify role')
        done()
      })
    })

    it('fails (admin, uniqueness failure)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:edit', {
        email: 'admin@localhost.com'
      }, function (response) {
        response.error.should.equal('Error: Validation error')
        done()
      })
    })
  })

  describe('users:roles', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'users:roles', {}, function (response) {
        should.not.exist(response.error)
        response.roles.should.deepEqual([
          'new',
          'disabled',
          'admin',
          'marketer',
          'analyst',
          'developer',
          'designer'
        ])
        done()
      })
    })
  })

  describe('users:list', function () {
    it('succeeds', function (done) {
      specHelper.requestWithLogin(email, password, 'users:list', {}, function (response) {
        should.not.exist(response.error)
        response.users.length.should.equal(3)
        response.users[0].email.should.equal('admin@localhost.com')
        response.users[1].email.should.equal('user@fake.com')
        response.users[2].email.should.equal('otherUser@fake.com')
        done()
      })
    })
  })

  describe('user:delete', function () {
    it('succeeds (admin, other user)', function (done) {
      api.models.User.find({where: {id: userId}}).then(function (user) {
        specHelper.requestWithLogin(email, password, 'user:delete', {
          userId: userId
        }, function (response) {
          should.not.exist(response.error)
          api.models.Person.find({where: {guid: user.personGuid}}).then(function (person) {
            should.not.exist(person)
            api.models.PersonData.count({where: {personGuid: user.personGuid}}).then(function (count) {
              count.should.equal(0)
              done()
            })
          })
        })
      }).catch(done)
    })

    it('fails (admin, self (null))', function (done) {
      specHelper.requestWithLogin(email, password, 'user:delete', {}, function (response) {
        response.error.should.equal('Error: userId is a required parameter for this action')
        done()
      })
    })

    it('fails (admin, self (explicit))', function (done) {
      specHelper.requestWithLogin(email, password, 'user:delete', {
        userId: 1
      }, function (response) {
        response.error.should.equal('Error: you cannot delete yourself')
        done()
      })
    })

    it('fails (admin, not-found)', function (done) {
      specHelper.requestWithLogin(email, password, 'user:delete', {
        userId: 999
      }, function (response) {
        response.error.should.equal('Error: user not found')
        done()
      })
    })

    it('fails (non-admin, other user)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:delete', {
        userId: 1
      }, function (response) {
        response.error.should.equal('Error: admin role requried')
        done()
      })
    })

    it('fails (non-admin, self)', function (done) {
      specHelper.requestWithLogin('otherUser@fake.com', 'abc123', 'user:delete', {}, function (response) {
        response.error.should.equal('Error: admin role requried')
        done()
      })
    })
  })
})
