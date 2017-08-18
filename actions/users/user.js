const async = require('async')

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
    let jobs = []
    let user
    let person

    jobs.push((done) => {
      user = api.models.User.build(data.params)
      user.teamGuid = data.session.teamGuid
      done()
    })

    jobs.push((done) => {
      user.updatePassword(data.params.password, done)
    })

    jobs.push((done) => {
      person = api.models.Person.build({teamGuid: user.teamGuid})
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

      person.save().then(() => {
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      user.personGuid = person.guid
      user.save().then(() => {
        data.response.user = user.apiData()
        api.tasks.enqueueIn(1, 'people:buildCreateEvent', {guid: person.guid, teamGuid: data.team.guid}, 'messagebot:people', done)
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
    userGuid: {
      required: false
    }
  },

  run: function (api, data, next) {
    let userGuid = data.session.userGuid
    if (data.params.userGuid && data.session.role === 'admin') {
      userGuid = data.params.userGuid
    }

    api.models.User.findOne({where: {
      guid: userGuid,
      teamGuid: data.session.teamGuid
    }}).then((user) => {
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
    userGuid: {
      required: false
    }
  },

  run: function (api, data, next) {
    let jobs = []
    let userGuid = data.session.userGuid
    let user
    let person

    if (data.params.userGuid && data.session.role === 'admin') {
      userGuid = data.params.userGuid
    }

    jobs.push((done) => {
      api.models.User.findOne({where: {
        guid: userGuid,
        teamGuid: data.session.teamGuid
      }}).then((u) => {
        user = u

        if (!user) { return done(new Error('user not found')) }

        if (data.params.role && user.role !== data.params.role && data.session.role !== 'admin') {
          return done(new Error('only admin role can modify role'))
        }

        if (data.params.userGuid && data.params.userGuid !== user.guid && data.session.role !== 'admin') {
          return done(new Error('only admin role can modify other users'))
        }

        done()
      }).catch(done)
    })

    jobs.push((done) => {
      user.updateAttributes(data.params).then(() => {
        data.response.user = user.apiData()
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.Person.findOne({where: {guid: user.personGuid}}).then((p) => {
        person = p

        if (!person) { return done(new Error('related person not found')) }
        person.hydrate(done)
      }).catch(done)
    })

    jobs.push((done) => {
      person.data.email = user.email
      person.data.firstName = user.firstName
      person.data.lastName = user.lastName
      person.data.role = user.role

      person.save().then(() => { done() }).catch(done)
    })

    jobs.push((done) => {
      if (data.params.password) {
        user.updatePassword(data.params.password, (error) => {
          if (error) { return done(error) }
          user.save().then(() => {
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
    userGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    let jobs = []
    let user
    let person

    jobs.push((done) => {
      api.models.User.findOne({where: {
        guid: data.params.userGuid,
        teamGuid: data.session.teamGuid
      }}).then((u) => {
        user = u
        if (!user) { return done(new Error('user not found')) }
        if (data.session.userGuid === user.guid) { return done(new Error('you cannot delete yourself')) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.Person.findOne({where: {guid: user.personGuid}}).then((p) => {
        person = p
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      user.destroy().then(() => {
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      person.destroy().then(() => {
        done()
      }).catch(done)
    })

    async.series(jobs, next)
  }
}
