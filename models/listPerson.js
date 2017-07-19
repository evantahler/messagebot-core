var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'ListPerson',

    model: api.sequelize.sequelize.define('listPerson',
      {
        'teamId': {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        'listId': {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        }
      },
      {
        instanceMethods: {
          apiData: function () {
            return {
              id: this.id,
              teamId: this.teamId,
              listId: this.listId,
              personGuid: this.personGuid,
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
