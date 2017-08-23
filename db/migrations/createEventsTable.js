module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'events',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        teamGuid: {
          allowNull: false,
          type: Sequelize.UUID
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        },

        'ip': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'device': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'messageGuid': {
          type: Sequelize.STRING,
          allowNull: true
        },
        'type': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'lat': {
          type: Sequelize.DECIMAL,
          allowNull: true
        },
        'lng': {
          type: Sequelize.DECIMAL,
          allowNull: true
        }
      }
    ).then(() => {
      return queryInterface.addIndex(
        'events', ['teamGuid', 'guid'], {
          indicesType: 'UNIQUE'
        }
      )
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('events')
  }
}
