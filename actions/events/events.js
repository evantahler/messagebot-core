var buildWhere = function (api, data) {
  var where = {
    teamId: data.team.id
  }

  for (var i in data.params.searchKeys) {
    if (data.params.searchKeys[i].indexOf('data.') === 0) {
      var key = data.params.searchKeys[i].split('.')[1]
      var value = data.params.searchValues[i]
      if (!where.guid) { where.guid = [] }
      where.guid.push(
        api.sequelize.sequelize.literal(`SELECT eventGuid FROM eventData WHERE \`key\` = "${key}" and \`value\` LIKE "${value}"`)
      )
    }
  }

  for (var j in data.params.searchKeys) {
    if (data.params.searchKeys[j].indexOf('data.') !== 0) {
      where[data.params.searchKeys[j]] = data.params.searchValues[j]
    }
  }

  return where
}

exports.eventsSearch = {
  name: 'events:search',
  description: 'events:search',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    searchKeys: { required: true },
    searchValues: { required: true },
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
    sort: { required: false }
  },

  run: function (api, data, next) {
    api.models.Event.findAndCountAll({
      where: buildWhere(api, data),
      order: data.params.sort,
      limit: data.params.size,
      offset: data.params.from
    }).then(function (result) {
      data.response.total = result.count
      data.response.events = result.rows.map(function (row) { return row.apiData() })
      next()
    }).catch(next)
  }
}

exports.eventsAggregation = {
  name: 'events:aggregation',
  description: 'events:aggregation',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    searchKeys: { required: true },
    searchValues: { required: true },
    aggregation: { required: true, default: 'type' },
    interval: {
      required: true,
      default: 'DATE'
    },
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
    sort: { required: false }
  },

  run: function (api, data, next) {
    api.models.Event.findAll({
      attributes: [
        [`${data.params.interval}(createdAt)`, data.params.interval],
        data.params.aggregation,
        [api.sequelize.sequelize.fn('count', api.sequelize.sequelize.col('guid')), 'TOTAL']
      ],
      where: buildWhere(api, data),
      order: data.params.sort,
      limit: data.params.size,
      offset: data.params.from,
      group: [api.sequelize.sequelize.literal(`${data.params.interval}(createdAt)`), data.params.aggregation]
    }).then(function (results) {
      data.response.aggregations = {}
      results.forEach(function (r) {
        if (!data.response.aggregations[r.dataValues[data.params.interval]]) {
          var d = {}
          d[r[data.params.aggregation]] = r.dataValues.TOTAL
          data.response.aggregations[r.dataValues[data.params.interval]] = d
        } else {
          data.response.aggregations[r.dataValues[data.params.interval]][r[data.params.aggregation]] = r.dataValues.TOTAL
        }
      })
      next()
    }).catch(next)
  }
}
