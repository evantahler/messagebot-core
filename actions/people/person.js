var async = require('async')

exports.personCreate = {
  name: 'person:create',
  description: 'person:create',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: false },
    data: { required: false, default: {} },
    source: { required: true },
    createdAt: {
      required: false,
      formatter: function (p) {
        return new Date(parseInt(p))
      }
    }
  },

  run: function (api, data, next) {
    var person = api.models.Person.build(data.params)
    person.data = data.params.data
    person.teamId = data.team.id

    // location and device will be updated by events as they come in
    person.device = 'unknown'
    person.listOptOuts = []
    person.globalOptOut = false

    person.save().then(function () {
      api.tasks.enqueueIn(1, 'people:buildCreateEvent', {guid: person.guid, teamId: data.team.id}, 'messagebot:people', function (error) {
        if (error) { return api.log('person creation error: ' + error, 'error', data.params) }
        data.response.person = person.apiData()
        next()
      })
    }).catch(next)
  }
}

exports.personEdit = {
  name: 'person:edit',
  description: 'person:edit',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: true },
    source: { required: false },
    data: { required: true }
  },

  run: function (api, data, next) {
    api.models.Person.findOne({
      where: {
        teamId: data.team.id,
        guid: data.params.guid
      }
    }).then(function (person) {
      if (!person) { return next(new Error(`Person (${data.params.guid}) not found`)) }
      person.hydrate(function (error) {
        if (error) { return next(error) }

        if (data.params.source) { person.source = data.params.source }

        if (data.params.data) {
          Object.keys(data.params.data).forEach(function (k) {
            person.data[k] = data.params.data[k]
          })
        }

        person.save().then(function () {
          data.response.person = person.apiData()
          next()
        }).catch(next)
      })
    }).catch(next)
  }
}

exports.personView = {
  name: 'person:view',
  description: 'person:view',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: true }
  },

  run: function (api, data, next) {
    // TODO: How to prevent people from accessing other folks' data?
    // Do we require-admin for person:view?
    api.models.Person.findOne({
      where: {
        teamId: data.team.id,
        guid: data.params.guid
      }
    }).then(function (person) {
      if (!person) { return next(new Error(`Person (${data.params.guid}) not found`)) }

      person.hydrate(function (error) {
        if (error) { return next(error) }
        data.response.person = person.apiData()
        data.response.lists = []

        api.models.ListPerson.findAll({where: {
          personGuid: person.guid
        },
          include: [api.models.List]
        }).then(function (listPeople) {
          listPeople.forEach(function (listPerson) {
            var d = listPerson.list.apiData()
            d.joinedAt = listPerson.createdAt
            data.response.lists.push(d)
          })

          next()
        }).catch(next)
      })
    }).catch(next)
  }
}

exports.personOpt = {
  name: 'person:opt',
  description: 'person:opt',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    direction: {
      required: true,
      formatter: function (p) {
        return p.toLowerCase()
      },
      validator: function (p) {
        if (['in', 'out'].indexOf(p) < 0) { return new Error('you can opt "in" our or "out"') }
        return true
      }
    },
    global: {
      required: false,
      default: false,
      formatter: function (p) {
        if (p === 'true' || p === true) { return true }
        if (p === 'false' || p === false) { return false }
        return null
      }
    },
    listId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: true }
  },

  run: function (api, data, next) {
    var jobs = []
    var person

    jobs.push(function (done) {
      api.models.Person.findOne({where: {
        teamId: data.team.id,
        guid: data.params.guid
      }}).then(function (p) {
        person = p
        if (!person) { return done(new Error(`Person (${data.params.guid}) not found`)) }
        done()
      }).catch(done)
    })

    if (data.params.global === false) {
      jobs.push(function (done) {
        api.models.List.findOne({
          where: {
            id: data.params.listId,
            teamId: data.team.id
          }
        }).then(function (list) {
          if (!list) { return done(new Error('List not found')) }
          done()
        }).catch(done)
      })
    }

    if (data.params.global === true) {
      jobs.push(function (done) {
        var val = false
        if (data.params.direction === 'out') { val = true }
        person.globalOptOut = val
        process.nextTick(done)
      })
    }

    if (data.params.global === false) {
      jobs.push(function (done) {
        var listOptOuts = Object.assign([], person.listOptOuts)
        if (data.params.direction === 'out') {
          if (listOptOuts.indexOf(data.params.listId) < 0) {
            listOptOuts.push(data.params.listId)
          }
        }

        if (data.params.direction === 'in') {
          if (listOptOuts.indexOf(data.params.listId) >= 0) {
            var idx = listOptOuts.indexOf(data.params.listId)
            listOptOuts.splice(idx, 1)
          }
        }

        person.listOptOuts = listOptOuts
        process.nextTick(done)
      })
    }

    jobs.push(function (done) {
      person.save().then(function () { done() }).catch(done)
    })

    async.series(jobs, next)
  }
}

exports.personDelete = {
  name: 'person:delete',
  description: 'person:delete',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: true }
  },

  run: function (api, data, next) {
    var jobs = []
    var person

    jobs.push(function (done) {
      api.models.Person.findOne({where: {
        teamId: data.team.id,
        guid: data.params.guid
      }}).then(function (p) {
        person = p
        if (!person) { return done(new Error(`Person (${data.params.guid}) not found`)) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      person.destroy().then(() => { done() }).catch(done)
    })

    async.series(jobs, next)
  }
}
