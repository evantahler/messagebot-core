var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'Setting',

    model: api.sequelize.sequelize.define('setting',
      {
        'teamId': {
          type: Sequelize.BIGINT,
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
              teamId: this.teamId,
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
