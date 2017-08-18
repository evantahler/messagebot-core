const Sequelize = require('sequelize')
// const uuid = require('uuid')
const async = require('async')

let loader = function (api) {
  /* --- Priave Methods --- */
  let uniqueDataKeys = [
    'email',
    'phoneNumber',
    'token',
    'pushToken'
  ]

  /* --- Public Model --- */

  return {
    name: 'Person',

    model: api.sequelize.sequelize.define('person',
      {
        // guid: {
        //   type: Sequelize.UUID,
        //   primaryKey: true,
        //   defaultValue: () => { return uuid.v4() }
        // },
        teamGuid: {
          allowNull: false,
          type: Sequelize.UUID
        },

        'listOptOuts': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            let q = this.getDataValue('listOptOuts')
            if (q && q.length > 0) {
              return JSON.parse(q)
            } else {
              return []
            }
          },
          set: function (q) {
            if (q && typeof q !== 'string') {
              q = JSON.stringify(q)
            }
            this.setDataValue('listOptOuts', q)
          }
        },
        'globalOptOut': {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        'source': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'device': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'lat': {
          type: Sequelize.DECIMAL,
          allowNull: true
        },
        'lng': {
          type: Sequelize.DECIMAL,
          allowNull: true
        }
      },
      {
        hooks: {
          beforeCreate: (self) => { return api.sequelize.updatateData(self, api.models.PersonData, 'personGuid', uniqueDataKeys) },
          beforeUpdate: (self) => { return api.sequelize.updatateData(self, api.models.PersonData, 'personGuid', uniqueDataKeys) },
          beforeDestroy: (self) => {
            return new Promise((resolve, reject) => {
              let jobs = []

              jobs.push((done) => {
                api.models.ListPerson.destroy({
                  where: {
                    personGuid: self.guid,
                    teamId: self.teamId
                  }
                }).then(() => {
                  done()
                }).catch(done)
              })

              jobs.push((done) => {
                api.models.Event.destroy({where: {personGuid: self.guid}}).then(() => {
                  done()
                }).catch(done)
              })

              jobs.push((done) => {
                api.models.Message.destroy({where: {personGuid: self.guid}}).then(() => {
                  done()
                }).catch(done)
              })

              jobs.push((done) => {
                api.models.PersonData.destroy({where: {personGuid: self.guid}}).then(() => {
                  done()
                }).catch(done)
              })

              async.series(jobs, (error) => {
                if (error) { return reject(error) }
                resolve()
              })
            })
          }
        },

        instanceMethods: {
          hydrate: function (callback) {
            this.data = {}
            let self = this
            api.models.PersonData.findAll({where: {personGuid: this.guid}}).then((datas) => {
              datas.forEach((d) => { self.data[d.key] = d.value })
              callback(null, datas)
            }).catch(callback)
          },

          apiData: function () {
            return {
              guid: this.guid,
              listOptOuts: this.listOptOuts,
              globalOptOut: this.globalOptOut,
              source: this.source,
              device: this.device,
              lat: this.lat,
              lng: this.lng,

              data: this.data || {},

              updatedAt: this.updatedAt,
              createdAt: this.createdAt
            }
          }
        }
      }
    )
  }
}

module.exports = loader
