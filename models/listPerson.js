const Sequelize = require('sequelize')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'ListPerson',

    model: api.sequelize.sequelize.define('listPerson',
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
              guid: this.guid,
              listGuid: this.listGuid,
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
