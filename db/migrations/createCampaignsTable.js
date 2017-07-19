module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'campaigns',
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
        'type': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default'
        },
        'transport': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'listId': {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        'templateId': {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        'campaignVariables': {
          type: Sequelize.TEXT,
          allowNull: true
        },
        'triggerEventMatch': {
          type: Sequelize.TEXT,
          allowNull: true
        },

        'sendAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'sendingAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'sentAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'triggerDelay': {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        'reSendDelay': {
          type: Sequelize.INTEGER,
          allowNull: true
        }

      }
    ).then(function () {
      return queryInterface.addIndex(
        'campaigns', ['teamId']
      ).then(function () {
        return queryInterface.addIndex(
          'campaigns', ['teamId', 'name'], {
            indicesType: 'UNIQUE'
          }
        )
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('campaigns')
  }
}
