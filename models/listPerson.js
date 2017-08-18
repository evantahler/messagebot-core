const Sequelize = require('sequelize')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'ListPerson',

    model: api.sequelize.sequelize.define('listPerson',
      {
        'teamGuid': {
          type: Sequelize.UUID,
          allowNull: false
        },
        'listGuid': {
          type: Sequelize.UUID,
          allowNull: false
        },
        'personGuid': {
          type: Sequelize.UUID,
          allowNull: false
        }
      },
      {
        instanceMethods: {
          apiData: function () {
            return {
              id: this.id,
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
