module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'settings',
      {
        id: {
          type: Sequelize.BIGINT,
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
      }
    ).then(() => {
      return queryInterface.addIndex(
        'settings', ['teamId']
      ).then(() => {
        return queryInterface.addIndex(
          'settings', ['teamId', 'key'], {
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
