var path = require('path')
var fs = require('fs')
var Sequelize = require('sequelize')

module.exports = {
  loadPriority: 100,
  startPriority: 100,

  initialize: function (api, next) {
    api.models = api.models || {}

    var sequelizeInstance = new Sequelize(
      api.config.sequelize.database,
      api.config.sequelize.username,
      api.config.sequelize.password,
      api.config.sequelize
    )

    api.sequelize = {

      sequelize: sequelizeInstance,

      connect: function (callback) {
        var dir = path.normalize(api.projectRoot + '/models')
        fs.readdirSync(dir).forEach(function (file) {
          var loader = require(dir + path.sep + file)(api)
          api.models[loader.name] = loader.model
        })

        /* --- associations --- */

        // Campaign
        api.models.Campaign.belongsTo(api.models.List)
        api.models.Campaign.belongsTo(api.models.Team)
        api.models.Campaign.belongsTo(api.models.Template)

        // List
        api.models.List.hasMany(api.models.ListPerson)
        api.models.List.belongsTo(api.models.Team)

        // List Person
        api.models.ListPerson.belongsTo(api.models.List)
        api.models.ListPerson.belongsTo(api.models.Team)

        // Team
        api.models.Team.hasMany(api.models.Campaign)
        api.models.Team.hasMany(api.models.List)
        api.models.Team.hasMany(api.models.ListPerson)
        api.models.Team.hasMany(api.models.Template)
        api.models.Team.hasMany(api.models.User)
        api.models.Team.hasMany(api.models.Setting)

        // Template
        api.models.Template.belongsTo(api.models.Team)

        // User
        api.models.User.belongsTo(api.models.Team)

        // Event
        api.models.EventData.belongsTo(api.models.Event)
        api.models.Event.hasMany(api.models.EventData)

        // Message
        api.models.MessageData.belongsTo(api.models.Message)
        api.models.Message.hasMany(api.models.MessageData)

        // Person
        api.models.PersonData.belongsTo(api.models.Person)
        api.models.Person.hasMany(api.models.PersonData)

        callback()
      },

      test: function (callback) {
        api.models.User.count().then(function (data) {
          api.log('connected to sequelize')
          callback()
        }).catch(function (error) {
          api.log('cannot connect to sequelize:', 'crit')
          api.log(error, 'crit')
          callback(error)
        })
      },

      query: function (q, type, callback) {
        if (typeof type === 'function') { callback = type; type = null }
        if (!type) { type = api.sequelize.sequelize.QueryTypes.SELECT }

        api.sequelize.sequelize.query(q, {type: type}).then(function (users) {
          callback(null, users)
        }).catch(callback)
      }

    }

    next()
  },

  start: function (api, next) {
    api.sequelize.connect(function (error) {
      if (error) { return next(error) }
      api.sequelize.test(next)
    })
  }
}
