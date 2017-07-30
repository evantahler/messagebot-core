const async = require('async')

exports.peopleSearch = {
  name: 'people:search',
  description: 'people:search',
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
    api.models.Person.findAndCountAll({
      where: api.sequelize.buildCompoundWhere(data, 'personGuid', 'personData'),
      order: [['createdAt', 'DESC']],
      limit: data.params.size,
      offset: data.params.from
    }).then(function (result) {
      data.response.people = []
      let jobs = []
      data.response.total = result.count
      result.rows.forEach((row) => {
        jobs.push((done) => {
          row.hydrate((error) => {
            data.response.people.push(row.apiData())
            done(error)
          })
        })
      })

      async.parallel(jobs, next)
    }).catch(next)
  }
}

exports.peopleAggregation = {
  name: 'people:aggregation',
  description: 'people:aggregation',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    searchKeys: { required: true },
    searchValues: { required: true },
    aggregation: { required: true, default: 'source' },
    interval: {
      required: true,
      default: 'DATE'
    },
    start: {
      required: false,
      formatter: function (p) { return parseInt(p) },
      default: function (p) { return 0 }
    },
    end: {
      required: false,
      formatter: function (p) { return parseInt(p) },
      default: function (p) { return new Date().getTime() }
    }
  },

  run: function (api, data, next) {
    api.models.Person.findAll({
      attributes: [
        [`${data.params.interval}(createdAt)`, data.params.interval],
        data.params.aggregation,
        [api.sequelize.sequelize.fn('count', api.sequelize.sequelize.col('guid')), 'TOTAL']
      ],
      where: api.sequelize.buildCompoundWhere(data, 'personGuid', 'personData'),
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
