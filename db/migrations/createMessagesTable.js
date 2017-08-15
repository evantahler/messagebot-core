module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'messages',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        teamId: {
          allowNull: false,
          type: Sequelize.BIGINT
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        },

        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'campaignId': {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        'transport': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'body': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'sentAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'readAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'actedAt': {
          type: Sequelize.DATE,
          allowNull: true
        }
      }
    ).then(() => {
      return queryInterface.addIndex(
        'messages', ['teamId', 'guid'], {
          indicesType: 'UNIQUE'
        }
      )
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('messages')
  }
}
