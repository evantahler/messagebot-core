exports.templatesList = {
  name: 'templates:list',
  description: 'templates:list',
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
    folder: { required: false }
  },

  run: function (api, data, next) {
    let query = {
      where: { teamGuid: data.session.teamGuid },
      order: [
        ['folder', 'asc'],
        ['name', 'asc']
      ],
      offset: data.params.from,
      limit: data.params.size
    }

    if (data.params.folder) {
      query.where.folder = data.params.folder
    }

    api.models.Template.findAndCountAll(query).then((response) => {
      data.response.total = response.count
      data.response.templates = []

      response.rows.forEach((template) => {
        data.response.templates.push(template.apiData())
      })

      next()
    }).catch(next)
  }
}

exports.campaignsFolders = {
  name: 'templates:folders',
  description: 'templates:folders',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {},

  run: function (api, data, next) {
    api.models.Template.aggregate('folder', 'DISTINCT', {where: {teamGuid: data.session.teamGuid}, plain: false}).then((response) => {
      data.response.folders = []
      response.forEach((r) => { data.response.folders.push(r.DISTINCT) })
      data.response.folders.sort()
      next()
    }).catch(next)
  }
}
