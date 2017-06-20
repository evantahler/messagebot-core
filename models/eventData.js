var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'EventData',

    model: api.sequelize.sequelize.define('eventData',
      {
        eventGuid: {
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
