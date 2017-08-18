exports.listsTypes = {
  name: 'lists:types',
  description: 'lists:types',
  outputExample: {},
  middleware: ['logged-in-session'],
  inputs: {},
  run: function (api, data, next) {
    data.response.validTypes = api.models.List.build().validTypes()
    next()
  }
}

exports.listsList = {
  name: 'lists:list',
  description: 'lists:list',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    from: {
      required: false,
      formatter: function (p) { return parseInt(p) },
      default: function (p) { return 0 }
    },
    size: {
      required: false,
      formatter: function (p) { return parseInt(p) },
      default: function (p) { return 100 }
    },
    folder: { required: false },
    order: {
      required: false,
      default: [
        ['name', 'asc'],
        ['createdAt', 'desc']
      ]
    }
  },

  run: function (api, data, next) {
    let query = {
      where: { teamGuid: data.session.teamGuid },
      order: data.params.order,
      offset: data.params.from,
      limit: data.params.size
    }

    if (data.params.folder) {
      query.where.folder = data.params.folder
    }

    api.models.List.findAndCountAll(query).then((response) => {
      data.response.total = response.count
      data.response.lists = []

      response.rows.forEach((list) => {
        data.response.lists.push(list.apiData())
      })

      next()
    }).catch(next)
  }
}

exports.listsFolders = {
  name: 'lists:folders',
  description: 'lists:folders',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {},

  run: function (api, data, next) {
    api.models.List.aggregate('folder', 'DISTINCT', {where: {teamGuid: data.session.teamGuid}, plain: false}).then((response) => {
      data.response.folders = []
      response.forEach((r) => { data.response.folders.push(r.DISTINCT) })
      data.response.folders.sort()
      next()
    }).catch(next)
  }
}
