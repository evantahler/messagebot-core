var async = require('async')

var alias = function (api, team) {
  return api.utils.buildAlias(team, 'people')
}

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
    var where = {}
    for (var i in data.params.searchKeys) {
      where[data.params.searchKeys[i]] = data.params.searchValues[i]
    }

    api.models.Person.findAndCountAll({
      where: where,
      order: data.params.sort,
      limit: data.params.size,
      offset: data.params.from
    }).then(function (result) {
      data.response.total = result.count
      data.response.people = result.rows.map(function (row) { return row.apiData() })
      next()
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
    maximumSelections: {
      required: true,
      formatter: function (p) { return parseInt(p) },
      default: function (p) { return 5 }
    },
    selections: {
      required: false,
      formatter: function (p) {
        if (p.length === 0) { return [] }
        return p.split(',')
      },
      default: function (p) { return '' }
    },
    start: {
      required: false,
      formatter: function (p) { return new Date(parseInt(p)) },
      default: function (p) { return 0 }
    },
    end: {
      required: false,
      formatter: function (p) { return new Date(parseInt(p)) },
      default: function (p) { return new Date().getTime() }
    },
    interval: { required: true }
  },

  run: function (api, data, next) {
    var jobs = []
    var aggJobs = []
    var sources = []
    data.response.aggregations = {}

    jobs.push(function (done) {
      api.elasticsearch.distinct(
        alias(api, data.team),
        data.params.searchKeys,
        data.params.searchValues,
        data.params.start,
        data.params.end,
        'createdAt',
        'source',
        function (error, buckets) {
          if (error) { return done(error) }
          buckets.buckets.forEach(function (b) {
            sources.push(b.key)
          })
          data.response.selections = sources
          data.response.selectionsName = 'sources'
          done()
        }
      )
    })

    jobs.push(function (done) {
      aggJobs.push(function (aggDone) {
        api.elasticsearch.aggregation(
          alias(api, data.team),
          ['guid'],
          ['_exists'],
          data.params.start,
          data.params.end,
          'createdAt',
          'date_histogram',
          'createdAt',
          data.params.interval,
          function (error, buckets) {
            if (error) { return aggDone(error) }
            data.response.aggregations._all = buckets.buckets
            aggDone()
          }
        )
      })

      done()
    })

    jobs.push(function (done) {
      sources.forEach(function (source) {
        if (aggJobs.length <= data.params.maximumSelections && (data.params.selections.length === 0 || data.params.selections.indexOf(source) >= 0)) {
          aggJobs.push(function (aggDone) {
            api.elasticsearch.aggregation(
              alias(api, data.team),
              ['source'].concat(data.params.searchKeys),
              [source].concat(data.params.searchValues),
              data.params.start,
              data.params.end,
              'createdAt',
              'date_histogram',
              'createdAt',
              data.params.interval,
              function (error, buckets) {
                if (error) { return aggDone(error) }
                data.response.aggregations[source] = buckets.buckets
                aggDone()
              }
            )
          })
        }
      })

      done()
    })

    jobs.push(function (done) {
      async.series(aggJobs, done)
    })

    async.series(jobs, next)
  }
}
