var path = require('path')
var fs = require('fs')
var Sequelize = require('sequelize')
var async = require('async')

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
        api.models.EventData.belongsTo(api.models.Event, {foreignKey: 'eventGuid'})
        api.models.Event.hasMany(api.models.EventData, {foreignKey: 'eventGuid'})

        // Message
        api.models.MessageData.belongsTo(api.models.Message, {foreignKey: 'messageGuid'})
        api.models.Message.hasMany(api.models.MessageData, {foreignKey: 'messageGuid'})

        // Person
        api.models.PersonData.belongsTo(api.models.Person, {foreignKey: 'personGuid'})
        api.models.Person.hasMany(api.models.PersonData, {foreignKey: 'personGuid'})

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

        api.sequelize.sequelize.query(q, {type: type}).then(function (rows) {
          callback(null, rows)
        }).catch(callback)
      },

      updatateData: function (self, model, remoteKey, uniqueDataKeys) {
        return new Promise(function (resolve, reject) {
          var jobs = []
          if (!self.data) { self.data = {} }
          var remainingKeys = Object.keys(self.data)
          var consumedKeys = []
          if (!uniqueDataKeys) { uniqueDataKeys = [] }

          remainingKeys.forEach(function (k) {
            if (uniqueDataKeys.indexOf(k) >= 0) {
              jobs.push(function (done) {
                var where = {
                  teamId: self.teamId,
                  key: k,
                  value: self.data[k]
                }
                where[remoteKey] = {$not: self.guid}

                model.findOne({where: where}).then(function (item) {
                  if (item) { return done(new Error(`${remoteKey} ${item[remoteKey]} already exists with ${k} of ${self.data[k]}`)) }
                  done()
                }).catch(done)
              })
            }
          })

          var where = {}
          where[remoteKey] = self.guid
          model.findAll({where: where}).then(function (datas) {
            remainingKeys.forEach(function (k) {
              datas.forEach(function (d) {
                if (k === d.key) {
                  consumedKeys.push(k)
                  jobs.push(function (done) {
                    d.updateAttributes({value: self.data[k]}).then(function () {
                      done()
                    }).catch(done)
                  })
                }
              })
            })

            remainingKeys.forEach(function (k) {
              if (consumedKeys.indexOf(k) < 0) {
                jobs.push(function (done) {
                  var o = {
                    teamId: self.teamId,
                    key: k,
                    value: self.data[k]
                  }
                  o[remoteKey] = self.guid

                  model.create(o).then(function () {
                    done()
                  }).catch(done)
                })
              }
            })

            async.series(jobs, function (error) {
              if (error) { return reject(error) }
              return resolve()
            })
          }).catch(reject)
        })
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
