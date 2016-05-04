module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable(
      'listPeople',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        },

        'listId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false,
        },
      }
    );

    queryInterface.addIndex(
      'listPeople', ['personGuid'],{
        indexName: 'personGuidIndex'
      }
    );

    queryInterface.addIndex(
      'listPeople', ['listId'],{
        indexName: 'listIdIndex'
      }
    );

    queryInterface.addIndex(
      'listPeople', ['listId', 'personGuid'],{
        indexName: 'listIdIndexLock',
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.createTable('listPeople');
  }
};
