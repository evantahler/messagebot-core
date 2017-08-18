module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'lists',
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
        'type': {
          type: Sequelize.STRING,
          allowNull: false
        },

        'personQuery': {
          type: Sequelize.TEXT,
          allowNull: true
        },
        'eventQuery': {
          type: Sequelize.TEXT,
          allowNull: true
        },
        'messageQuery': {
          type: Sequelize.TEXT,
          allowNull: true
        },

        'peopleCount': {
          type: Sequelize.BIGINT,
          allowNull: false,
          default: 0
        },
        'peopleCountedAt': {
          type: Sequelize.DATE
        }
      }
    ).then(() => {
      return queryInterface.addIndex(
        'lists', ['teamGuid']
      ).then(() => {
        return queryInterface.addIndex(
          'lists', ['teamGuid', 'name'], {
            indicesType: 'UNIQUE'
          }
        )
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('lists')
  }
}
