module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'messageData',
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
        messageGuid: {
          type: Sequelize.UUID,
          allowNull: false
        },
        teamId: {
          type: Sequelize.BIGINT,
          allowNull: false
        },

        'key': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'value': {
          type: Sequelize.STRING,
          allowNull: false
        }
      }
    ).then(function () {
      return queryInterface.addIndex(
        'messageData', ['messageGuid', 'key'], {
          indicesType: 'UNIQUE'
        }
      )
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('messageData')
  }
}
