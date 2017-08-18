module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'eventData',
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
        eventGuid: {
          type: Sequelize.UUID,
          allowNull: false
        },
        teamGuid: {
          type: Sequelize.UUID,
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
    ).then(() => {
      return queryInterface.addIndex(
        'eventData', ['eventGuid', 'key'], {
          indicesType: 'UNIQUE'
        }
      )
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('eventData')
  }
}
