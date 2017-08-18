const path = require('path')
const fs = require('fs')
const Sequelize = require('sequelize')
const async = require('async')

module.exports = {
  loadPriority: 100,
  startPriority: 100,

  initialize: function (api, next) {
    api.models = api.models || {}

    let sequelizeInstance = new Sequelize(
      api.config.sequelize.database,
      api.config.sequelize.username,
      api.config.sequelize.password,
      api.config.sequelize
    )

    api.sequelize = {

      sequelize: sequelizeInstance,

      connect: function (callback) {
        let dir = path.normalize(api.projectRoot + '/models')
        fs.readdirSync(dir).forEach((file) => {
          const loader = require(dir + path.sep + file)(api)
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
        api.models.ListPerson.belongsTo(api.models.Person)

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
        api.models.User.count().then((data) => {
          api.log('connected to sequelize')
          callback()
        }).catch((error) => {
          api.log('cannot connect to sequelize:', 'crit')
          api.log(error, 'crit')
          callback(error)
        })
      },

      query: function (q, type, callback) {
        if (typeof type === 'function') { callback = type; type = null }
        if (!type) { type = api.sequelize.sequelize.QueryTypes.SELECT }

        api.sequelize.sequelize.query(q, {type: type}).then((rows) => {
          callback(null, rows)
        }).catch(callback)
      },

      buildCompoundWhere: function (data, leaderFK, FKTAble) {
        let where = { teamGuid: data.team.guid }

        if (data.params.start && data.params.end) {
          where.createdAt = {
            $gte: new Date(data.params.start),
            $lte: new Date(data.params.end)
          }
        }

        for (let i in data.params.searchKeys) {
          if (data.params.searchKeys[i].indexOf('data.') === 0) {
            let key = data.params.searchKeys[i].split('.')[1]
            let value = data.params.searchValues[i]
            if (!where.$and) { where.$and = [] }
            where.$and.push(
              { guid: {
                $in: api.sequelize.sequelize.literal(
                  `(SELECT ${leaderFK} FROM ${FKTAble} WHERE \`key\` = "${key}" and \`value\` LIKE "${value}")`
                )
              }}
            )
          }
        }

        for (let j in data.params.searchKeys) {
          if (data.params.searchKeys[j].indexOf('data.') !== 0) {
            if (data.params.searchValues[j] === '%') {
              where[data.params.searchKeys[j]] = {$ne: null}
            } else if (data.params.searchValues[j].indexOf('%') >= 0) {
              where[data.params.searchKeys[j]] = { $like: data.params.searchValues[j] }
            } else {
              where[data.params.searchKeys[j]] = data.params.searchValues[j]
            }
          }
        }

        return where
      },

      updatateData: function (self, model, remoteKey, uniqueDataKeys) {
        return new Promise((resolve, reject) => {
          let jobs = []
          if (!self.data) { self.data = {} }
          let remainingKeys = Object.keys(self.data)
          let consumedKeys = []
          if (!uniqueDataKeys) { uniqueDataKeys = [] }

          remainingKeys.forEach((k) => {
            if (uniqueDataKeys.indexOf(k) >= 0) {
              jobs.push((done) => {
                let where = {
                  teamGuid: self.teamGuid,
                  key: k,
                  value: self.data[k]
                }
                where[remoteKey] = {$not: self.guid}

                model.findOne({where: where}).then((item) => {
                  if (item) { return done(new Error(`${remoteKey} ${item[remoteKey]} already exists with ${k} of ${self.data[k]}`)) }
                  done()
                }).catch(done)
              })
            }
          })

          let where = {}
          where[remoteKey] = self.guid
          model.findAll({where: where}).then((datas) => {
            remainingKeys.forEach((k) => {
              datas.forEach((d) => {
                if (k === d.key) {
                  consumedKeys.push(k)
                  jobs.push((done) => {
                    if (self.data[k] === '_delete') {
                      d.destroy().then(() => { done() }).catch(done)
                    } else {
                      d.updateAttributes({value: self.data[k]}).then(() => { done() }).catch(done)
                    }
                  })
                }
              })
            })

            remainingKeys.forEach((k) => {
              let v = self.data[k]
              if (consumedKeys.indexOf(k) < 0 && v !== null && v !== undefined) {
                if (typeof v === 'object') { v = JSON.stringify(v) }
                jobs.push((done) => {
                  let o = {
                    teamGuid: self.teamGuid,
                    key: k,
                    value: v
                  }
                  o[remoteKey] = self.guid
                  model.create(o).then(() => {
                    done()
                  }).catch(done)
                })
              }
            })

            async.series(jobs, (error) => {
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
    api.sequelize.connect((error) => {
      if (error) { return next(error) }
      api.sequelize.test(next)
    })
  }
}
