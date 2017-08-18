const Sequelize = require('sequelize')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'Setting',

    model: api.sequelize.sequelize.define('setting',
      {
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
              id: this.id,
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
