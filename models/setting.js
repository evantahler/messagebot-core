const Sequelize = require('sequelize')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'Setting',

    model: api.sequelize.sequelize.define('setting',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: () => { return uuid.v4() }
        },
        'teamGuid': {
          type: Sequelize.UUID,
          allowNull: false
        },

        'key': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'value': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'description': {
          type: Sequelize.TEXT,
          allowNull: false
        }
      },
      {
        instanceMethods: {
          apiData: function () {
            return {
              guid: this.guid,
              key: this.key,
              value: this.value,
              description: this.description,
              createdAt: this.createdAt,
              updatedAt: this.updatedAt
            }
          }
        }
      }
    )
  }
}

module.exports = loader
