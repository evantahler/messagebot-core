const Sequelize = require('sequelize')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'PersonData',

    model: api.sequelize.sequelize.define('personData',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: () => { return uuid.v4() }
        },
        personGuid: {
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
              personGuid: this.personGuid,
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
