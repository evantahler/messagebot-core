module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'settings',
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
      }
    ).then(() => {
      return queryInterface.addIndex(
        'settings', ['teamGuid']
      ).then(() => {
        return queryInterface.addIndex(
          'settings', ['teamGuid', 'key'], {
            indicesType: 'UNIQUE'
          }
        )
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('settings')
  }
}
