var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'Event',

    model: api.sequelize.sequelize.define('event',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        teamId: {
          type: Sequelize.BIGINT
        },

        'ip': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'device': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'messageGuid': {
          type: Sequelize.STRING,
          allowNull: true
        },
        'type': {
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
          beforeDestroy: function (self) {
            return api.models.EventData.destroy({where: {eventGuid: self.guid}})
          }
        },

        instanceMethods: {
          hydrate: function (callback) {
            this.data = {}
            api.models.EventData.findAll({where: {eventGuid: this.guid}}).then(function (datas) {
              datas.forEach(function (d) { this.data[d.key] = d.value })
              callback(null, datas)
            }).catch(callback)
          },

          apiData: function () {
            return {
              guid: this.guid,
              teamId: this.teamId,
              ip: this.ip,
              device: this.device,
              personGuid: this.personGuid,
              messageGuid: this.messageGuid,
              type: this.type,
              lat: this.lat,
              lng: this.lng,
              updatedAt: this.updatedAt
            }
          }
        }
      }
    )
  }
}

module.exports = loader
