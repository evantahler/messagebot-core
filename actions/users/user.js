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
    var user = api.models.User.build(data.params)
    user.teamId = data.session.teamId

    user.updatePassword(data.params.password, function (error) {
      if (error) { return next(error) }

      var person = new api.models.Person(data.team);

      ['email', 'firstName', 'lastName', 'role'].forEach(function (p) {
        person.data[p] = user[p]
      })

      person.data.source = 'admin'
      person.data.device = 'unknown'
      person.data.teamId = user.teamId
      person.data.listOptOuts = []
      person.data.globalOptOut = false

      person.create(function (error) {
        if (error) { api.log('person creation error: ' + error, 'error', data.params) }

        user.personGuid = person.data.guid
        user.save().then(function () {
          data.response.user = user.apiData()
          api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'people:buildCreateEvent', {guid: person.data.guid, teamId: data.team.id}, 'messagebot:people', next)
        }).catch(function (errors) {
          next(errors.errors[0].message)
        })
      })
    })
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
    var userId = data.session.userId
    if (data.params.userId && data.session.role === 'admin') {
      userId = data.params.userId
    }

    api.models.User.findOne({where: {
      id: userId,
      teamId: data.session.teamId
    }}).then(function (user) {
      if (!user) { return next(new Error('user not found')) }

      if (data.params.role && user.role !== data.params.role && data.session.role !== 'admin') {
        return next(new Error('only admin role can modify role'))
      }

      if (data.params.userId && data.params.userId !== user.id && data.session.role !== 'admin') {
        return next(new Error('only admin role can modify other users'))
      }

      user.updateAttributes(data.params).then(function () {
        data.response.user = user.apiData()

        var person = new api.models.Person(data.team, user.personGuid);

        ['email', 'firstName', 'lastName', 'role'].forEach(function (p) {
          person.data[p] = user[p]
        })

        person.edit(function (error) {
          if (error) { api.log('person edit error: ' + error, 'error', data.params) }

          if (data.params.password) {
            user.updatePassword(data.params.password, function (error) {
              if (error) { return next(error) }
              user.save().then(function () {
                next()
              }).catch(next)
            })
          } else {
            next()
          }
        })
      }).catch(next)
    }).catch(next)
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
    api.models.User.findOne({where: {
      id: data.params.userId,
      teamId: data.session.teamId
    }}).then(function (user) {
      if (!user) { return next(new Error('user not found')) }
      if (data.session.userId === user.id) { return next(new Error('you cannot delete yourself')) }
      user.destroy().then(function () {
        var person = new api.models.Person(data.team, user.personGuid)
        person.del(next)
      }).catch(next)
    }).catch(next)
  }
}
