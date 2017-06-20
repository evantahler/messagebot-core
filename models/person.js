var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

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
          type: Sequelize.INTEGER
        },

        'listOptOuts': {
          type: Sequelize.INTEGER,
          allowNull: false
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
        instanceMethods: {
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
