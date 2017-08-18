const Sequelize = require('sequelize')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'EventData',

    model: api.sequelize.sequelize.define('eventData',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: () => { return uuid.v4() }
        },
        eventGuid: {
          type: Sequelize.UUID,
          allowNull: false
        },
        teamGuid: {
          type: Sequelize.UUID,
          allowNull: false
        },

        'key': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'value': {
          type: Sequelize.STRING,
          allowNull: false
        }
      },
      {
        instanceMethods: {
          apiData: function () {
            return {
              eventGuid: this.eventGuid,
              key: this.key,
              value: this.value
            }
          }
        }
      }
    )
  }
}

module.exports = loader
