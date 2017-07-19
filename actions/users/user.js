var async = require('async')

exports.userCreate = {
  name: 'user:create',
  description: 'user:create',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    email: { required: true },
    password: { required: true },
    firstName: { required: true },
    lastName: { required: true },
    role: { required: true }
  },

  run: function (api, data, next) {
    var jobs = []
    var user
    var person

    jobs.push(function (done) {
      user = api.models.User.build(data.params)
      user.teamId = data.session.teamId
      done()
    })

    jobs.push(function (done) {
      user.updatePassword(data.params.password, done)
    })

    jobs.push(function (done) {
      person = api.models.Person.build({teamId: user.teamId})
      person.source = 'admin'
      person.device = 'unknown'
      person.listOptOuts = []
      person.globalOptOut = false
      person.data = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }

      person.save().then(function () {
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      user.personGuid = person.guid
      user.save().then(function () {
        data.response.user = user.apiData()
        api.tasks.enqueueIn(1, 'people:buildCreateEvent', {guid: person.guid, teamId: data.team.id}, 'messagebot:people', done)
      }).catch(done)
    })

    async.series(jobs, next)
  }
}

exports.userView = {
  name: 'user:view',
  description: 'user:view',
  outputExample: {},
  middleware: ['logged-in-session'],

  inputs: {
    userId: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    var userId = data.session.userId
    if (data.params.userId && data.session.role === 'admin') {
      userId = data.params.userId
    }

    api.models.User.findOne({where: {
      id: userId,
      teamId: data.session.teamId
    }}).then(function (user) {
      if (!user) { return next(new Error('user not found')) }
      data.response.user = user.apiData()
      next()
    }).catch(next)
  }
}

exports.userEdit = {
  name: 'user:edit',
  description: 'user:edit',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team'],

  inputs: {
    email: { required: false },
    password: { required: false },
    firstName: { required: false },
    lastName: { required: false },
    role: { required: false },
    userId: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    var jobs = []
    var userId = data.session.userId
    var user
    var person

    if (data.params.userId && data.session.role === 'admin') {
      userId = data.params.userId
    }

    jobs.push(function (done) {
      api.models.User.findOne({where: {
        id: userId,
        teamId: data.session.teamId
      }}).then(function (u) {
        user = u

        if (!user) { return done(new Error('user not found')) }

        if (data.params.role && user.role !== data.params.role && data.session.role !== 'admin') {
          return done(new Error('only admin role can modify role'))
        }

        if (data.params.userId && data.params.userId !== user.id && data.session.role !== 'admin') {
          return done(new Error('only admin role can modify other users'))
        }

        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      user.updateAttributes(data.params).then(function () {
        data.response.user = user.apiData()
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      api.models.Person.findOne({where: {guid: user.personGuid}}).then(function (p) {
        person = p

        if (!person) { return done(new Error('related person not found')) }
        person.hydrate(done)
      }).catch(done)
    })

    jobs.push(function (done) {
      person.data.email = user.email
      person.data.firstName = user.firstName
      person.data.lastName = user.lastName
      person.data.role = user.role

      person.save().then(function () { done() }).catch(done)
    })

    jobs.push(function (done) {
      if (data.params.password) {
        user.updatePassword(data.params.password, function (error) {
          if (error) { return done(error) }
          user.save().then(function () {
            done()
          }).catch(done)
        })
      } else {
        done()
      }
    })

    async.series(jobs, next)
  }
}

exports.userDelete = {
  name: 'user:delete',
  description: 'user:delete',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    userId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    var jobs = []
    var user
    var person

    jobs.push(function (done) {
      api.models.User.findOne({where: {
        id: data.params.userId,
        teamId: data.session.teamId
      }}).then(function (u) {
        user = u
        if (!user) { return done(new Error('user not found')) }
        if (data.session.userId === user.id) { return done(new Error('you cannot delete yourself')) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      api.models.Person.findOne({where: {guid: user.personGuid}}).then(function (p) {
        person = p
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      user.destroy().then(function () {
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      person.destroy().then(function () {
        done()
      }).catch(done)
    })

    async.series(jobs, next)
  }
}
