module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'campaigns',
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
        'listGuid': {
          type: Sequelize.UUID,
          allowNull: false
        },
        'templateGuid': {
          type: Sequelize.UUID,
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
    ).then(() => {
      return queryInterface.addIndex(
        'campaigns', ['teamGuid']
      ).then(() => {
        return queryInterface.addIndex(
          'campaigns', ['teamGuid', 'name'], {
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
