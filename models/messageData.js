var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'MessageData',

    model: api.sequelize.sequelize.define('messageData',
      {
        messageGuid: {
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
              messageGuid: this.messageGuid,
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
