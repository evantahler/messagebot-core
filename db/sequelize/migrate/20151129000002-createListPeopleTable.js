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
        'userGuid': {
          type: Sequelize.STRING,
          allowNull: false,
        },
      }
    );

    queryInterface.addIndex(
      'listPeople', ['userGuid'],{
        indexName: 'userGuidIndex'
      }
    );

    queryInterface.addIndex(
      'listPeople', ['listId'],{
        indexName: 'listIdIndex'
      }
    );

    queryInterface.addIndex(
      'listPeople', ['listId', 'userGuid'],{
        indexName: 'listIdIndexLock',
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.createTable('listPeople');
  }
};
