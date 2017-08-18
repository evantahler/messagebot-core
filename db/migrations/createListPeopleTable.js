module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'listPeople',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
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
          type: Sequelize.STRING,
          allowNull: false
        }
      }
    ).then(() => {
      return queryInterface.addIndex(
        'listPeople', ['teamGuid']
      ).then(() => {
        return queryInterface.addIndex(
          'listPeople', ['personGuid'], {
            indexName: 'personGuidIndex'
          }
        ).then(() => {
          return queryInterface.addIndex(
            'listPeople', ['listGuid'], {
              indexName: 'listIdIndex'
            }
          ).then(() => {
            return queryInterface.addIndex(
              'listPeople', ['listGuid', 'personGuid'], {
                indicesType: 'UNIQUE'
              }
            )
          })
        })
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('listPeople')
  }
}
