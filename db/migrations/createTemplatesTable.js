module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'templates',
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

        'name': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'description': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default'
        },
        'template': {
          type: Sequelize.TEXT,
          allowNull: true
        }
      }
    ).then(() => {
      return queryInterface.addIndex(
        'templates', ['teamGuid']
      ).then(() => {
        return queryInterface.addIndex(
          'templates', ['teamGuid', 'name'], {
            indicesType: 'UNIQUE'
          }
        )
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('templates')
  }
}
