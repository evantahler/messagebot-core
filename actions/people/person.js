var async = require('async')

exports.personCreate = {
  name: 'person:create',
  description: 'person:create',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    sync: { required: true, default: false },
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
    var person = new api.models.Person(data.team)
    person.data = data.params

    // location and device will be updated by events as they come in

    person.data.device = 'unknown'

    person.data.listOptOuts = []
    person.data.globalOptOut = false

    // return without waiting for the crete callback; log errors
    // this effectivley allows the tracking request to 'buffer' in RAM & returning to the client quickly
    // guid will be hydrated syncrhonusly before the save operation
    if (data.params.sync === false) {
      person.create(function (error) {
        if (error) { return api.log('person creation error: ' + error, 'error', data.params) }
        api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'people:buildCreateEvent', {guid: person.data.guid, teamId: data.team.id}, 'messagebot:people', function (error) {
          if (error) { return api.log('person creation error: ' + error, 'error', data.params) }
        })
      })
      data.response.guid = person.data.guid
      next()
    } else {
      person.create(function (error) {
        if (error) { return next(error) }
        data.response.guid = person.data.guid
        api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'people:buildCreateEvent', {guid: person.data.guid, teamId: data.team.id}, 'messagebot:people', next)
      })
    }
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
    var person = new api.models.Person(data.team, data.params.guid)
    person.data = data.params

    person.edit(function (error) {
      if (error) { return next(error) }
      data.response.person = person.data
      next()
    })
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

    var person = new api.models.Person(data.team, data.params.guid)
    person.data = data.params

    person.hydrate(function (error) {
      if (error) { return next(error) }
      data.response.person = person.data
      data.response.lists = []

      api.models.ListPerson.findAll({where: {
        personGuid: person.data.guid
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
    var person = new api.models.Person(data.team, data.params.guid)

    jobs.push(function (done) {
      person.hydrate(done)
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
        person.data.globalOptOut = val
        process.nextTick(done)
      })
    }

    if (data.params.global === false) {
      jobs.push(function (done) {
        if (data.params.direction === 'out') {
          if (person.data.listOptOuts.indexOf(data.params.listId) < 0) {
            person.data.listOptOuts.push(data.params.listId)
          }
        }

        if (data.params.direction === 'in') {
          if (person.data.listOptOuts.indexOf(data.params.listId) >= 0) {
            var idx = person.data.listOptOuts.indexOf(data.params.listId)
            person.data.listOptOuts.splice(idx, 1)
          }
        }

        process.nextTick(done)
      })
    }

    jobs.push(function (done) {
      person.edit(done)
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
      person = new api.models.Person(data.team, data.params.guid)
      person.hydrate(done)
    })

    jobs.push(function (done) {
      api.models.ListPerson.destroy({
        where: {
          personGuid: person.data.guid,
          teamId: data.team.id
        }
      }).then(function () {
        done()
      }).catch(done)
    });

    [
      ['events', 'Event'],
      ['messages', 'Message']
    ].forEach(function (typeGroup) {
      jobs.push(function (done) {
        // since the delete operation is async, we need to keep track of what we have already trigged to delete
        // otherwise our delete operation will error
        var deletedGuids = []

        var total = 1
        var alias = api.utils.buildAlias(data.team, typeGroup[0])
        async.whilst(function () {
          if (total > 0) { return true }
          return false
        }, function (again) {
          api.elasticsearch.search(
            alias,
            ['personGuid'],
            [person.data.guid],
            0,
            1000,
            null,
            1,
            function (error, results, _total) {
              if (error) { return again(error) }
              total = _total
              var deleteJobs = []
              results.forEach(function (result) {
                if (deletedGuids.indexOf(result.guid) < 0) {
                  deleteJobs.push(function (deleteDone) {
                    deletedGuids.push(result.guid)
                    var instnce = new api.models[typeGroup[1]](data.team, result.guid)
                    instnce.del(deleteDone)
                  })
                }
              })

              async.series(deleteJobs, function (error) {
                if (error) { return again(error) }
                setTimeout(again, 500)
              })
            }
          )
        }, done)
      })
    })

    jobs.push(function (done) {
      person.del(done)
    })

    async.series(jobs, next)
  }
}
