module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'templates',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        },

        'teamId': {
          type: Sequelize.INTEGER,
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
    ).then(function () {
      return queryInterface.addIndex(
        'templates', ['teamId']
      ).then(function () {
        return queryInterface.addIndex(
          'templates', ['teamId', 'name'], {
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
