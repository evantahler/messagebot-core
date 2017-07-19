module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'people',
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

        'listOptOuts': {
          type: Sequelize.TEXT,
          allowNull: true
        },
        'globalOptOut': {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        'source': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'device': {
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
    ).then(function () {
      return queryInterface.addIndex(
        'people', ['teamId', 'guid'], {
          indicesType: 'UNIQUE'
        }
      )
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('people')
  }
}
