let JSONValidator = function (p) {
  if (p === null) { return true }
  try {
    let o = JSON.parse(p)
    if (o && typeof o === 'object' && o !== null) {
      return true
    } else {
      return new Error('not valid JSON')
    }
  } catch (e) {
    return new Error('not valid JSON')
  }
}

let JSONFormatter = function (p) {
  if (p === '' || p === null) { return null } else { return p }
}

exports.listCreate = {
  name: 'list:create',
  description: 'list:create',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    description: { required: true },
    folder: {
      required: false,
      defualt: function () { return 'default' }
    },
    type: { required: true },
    personQuery: {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter
    },
    eventQuery: {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter
    },
    messageQuery: {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter
    }
  },

  run: function (api, data, next) {
    let list = api.models.List.build(data.params)
    list.teamGuid = data.session.teamGuid

    list.save().then(
      api.models.List.findOne({where: {name: data.params.name}})
    ).then((listObj) => {
      data.response.list = listObj.apiData()
      api.tasks.enqueue('lists:peopleCount', {listGuid: listObj.guid}, 'messagebot:lists', next)
    }).catch((errors) => {
      next(errors.errors[0].message)
    })
  }
}

exports.listView = {
  name: 'list:view',
  description: 'list:view',
  outputExample: {},
  middleware: ['logged-in-session'],

  inputs: {
    listGuid: {
      required: true
    },
    includeGuids: {
      required: true,
      default: false
    }
  },

  run: function (api, data, next) {
    api.models.List.findOne({where: {
      id: data.params.listGuid,
      teamGuid: data.session.teamGuid
    }}).then((list) => {
      if (!list) { return next(new Error('list not found')) }
      data.response.list = list.apiData()
      next()
    }).catch(next)
  }
}

exports.listCopy = {
  name: 'list:copy',
  description: 'list:copy',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    listGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.List.findOne({where: {
      guid: data.params.listGuid,
      teamGuid: data.session.teamGuid
    }}).then((list) => {
      if (!list) { return next(new Error('list not found')) }
      let newList = api.models.List.build({
        name: data.params.name,
        description: list.description,
        teamGuid: list.teamGuid,
        folder: list.folder,
        type: list.type,
        personQuery: list.personQuery,
        eventQuery: list.eventQuery,
        messageQuery: list.messageQuery
      })
      newList.save().then(() => {
        data.response.list = newList.apiData()

        api.utils.findInBatches(api.models.ListPerson, {where: {listGuid: list.guid}}, (listPerson, done) => {
          let newListPerson = api.models.ListPerson.build({
            personGuid: listPerson.personGuid,
            listGuid: newList.guid
          })
          newListPerson.save().then(() => {
            done()
          }).catch((errors) => {
            done(errors.errors[0].message)
          })
        }, () => {
          api.tasks.enqueue('lists:peopleCount', {listGuid: newList.guid}, 'messagebot:lists', next)
        })
      }).catch((errors) => {
        next(errors.errors[0].message)
      })
    }).catch(next)
  }
}

exports.listEdit = {
  name: 'list:edit',
  description: 'list:edit',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: false },
    description: { required: false },
    folder: { required: false },
    type: { required: false },

    personQuery: {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter
    },
    eventQuery: {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter
    },
    messageQuery: {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter
    },
    listGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.List.findOne({where: {
      guid: data.params.listGuid,
      teamGuid: data.session.teamGuid
    }}).then((list) => {
      if (!list) { return next(new Error('list not found')) }

      list.updateAttributes(data.params).then(() => {
        data.response.list = list.apiData()
        api.tasks.enqueue('lists:peopleCount', {listGuid: list.guid}, 'messagebot:lists', next)
      }).catch(next)
    }).catch(next)
  }
}

exports.listDelete = {
  name: 'list:delete',
  description: 'list:delete',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    listGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.List.findOne({where: {
      guid: data.params.listGuid,
      teamGuid: data.session.teamGuid
    }}).then((list) => {
      if (!list) { return next(new Error('list not found')) }
      api.models.ListPerson.destroy({where: {listGuid: list.guid}}).then(() => {
        list.destroy().then(() => {
          next()
        }).catch(next)
      }).catch(next)
    }).catch(next)
  }
}
