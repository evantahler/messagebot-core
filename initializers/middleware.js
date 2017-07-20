
var qs = require('qs')

module.exports = {
  loadPriority: 900,

  initialize: function (api, next) {
    /* --- Params Middleware --- */
    var middleware = {
      'data-preperation': {
        name: 'data-preperation',
        global: true,
        priority: 1,
        preProcessor: function (data, callback) {
          if (data.params.searchKeys) {
            if (typeof data.params.searchKeys === 'string') {
              data.params.searchKeys = data.params.searchKeys.split(',')
            }
          }

          if (data.params.searchValues) {
            if (typeof data.params.searchValues === 'string') {
              data.params.searchValues = data.params.searchValues.split(',')
            }
          }

          if (data.params.data && typeof data.params.data === 'string') {
            try {
              data.params.data = JSON.parse(data.params.data)
            } catch (e) {
              return callback(new Error('cannot parse `data`. Are you sure that it is JSON?'))
            }
          }

          // Allow for sloppy parsing of the data object in forms
          // IE: `curl -X POST -d 'personGuid=evan&type=pageView&data[page]=index.html' http://localhost:8080/api/event`
          var d
          for (var key in data.params) {
            if (key.indexOf('data[') === 0) {
              if (!data.params.data) { data.params.data = {} }
              d = qs.parse(key + '=' + data.params[key], api.config.servers.web.queryParseOptions)
              for (var newKey in d.data) {
                data.params.data[newKey] = d.data[newKey]
              }
              delete data.params[key]
            }
          }

          return callback()
        }
      },

      'require-team': {
        name: 'require-team',
        global: false,
        preProcessor: function (data, callback) {
          api.utils.determineActionsTeam(data, (error, team) => {
            if (error) { return callback(error) }
            if (!team) { return callback(new Error('Team not found for this request')) }
            data.team = team
            return callback()
          })
        }
      }
    }

    api.actions.addMiddleware(middleware['data-preperation'])
    api.actions.addMiddleware(middleware['require-team'])

    /* --- Inject team into Elasticsaerch models --- */
    api.models.orignalElasticSearch = {};
    ['Event', 'Person', 'Message'].forEach(function (key) {
      api.models.orignalElasticSearch[key] = api.models[key]

      api.models[key] = function (team, guid, index, alias) {
        var instance = new api.models.orignalElasticSearch[key](guid, index, alias)
        if (!index) { instance.index = team.id + '-' + instance.index }
        if (!alias) { instance.alias = team.id + '-' + instance.alias }
        return instance
      }
    })

    next()
  }
}
