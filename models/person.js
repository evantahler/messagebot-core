var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */
  var uniqueDataKeys = [
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
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        teamId: {
          type: Sequelize.BIGINT
        },

        'listOptOuts': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            var q = this.getDataValue('listOptOuts')
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
          beforeDestroy: function (self) { return api.models.PersonData.destroy({where: {personGuid: self.guid}}) }
        },

        instanceMethods: {
          hydrate: function (callback) {
            this.data = {}
            var self = this
            api.models.PersonData.findAll({where: {personGuid: this.guid}}).then(function (datas) {
              datas.forEach(function (d) { self.data[d.key] = d.value })
              callback(null, datas)
            }).catch(callback)
          },

          apiData: function () {
            return {
              guid: this.guid,
              teamId: this.teamId,
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
