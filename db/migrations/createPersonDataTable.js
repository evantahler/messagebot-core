module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'personData',
      {
        personGuid: {
          type: Sequelize.UUID,
          allowNull: false
        },
        teamId: {
          type: Sequelize.INTEGER,
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
        'personData', ['personGuid', 'key'], {
          indicesType: 'UNIQUE'
        }
      )
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('personData')
  }
}
