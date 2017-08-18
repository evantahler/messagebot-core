const Sequelize = require('sequelize')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'MessageData',

    model: api.sequelize.sequelize.define('messageData',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: () => { return uuid.v4() }
        },
        messageGuid: {
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
