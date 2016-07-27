module.exports = {
  up: function(queryInterface, Sequelize){
    return queryInterface.createTable(
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

        'teamId': {
          type: Sequelize.INTEGER,
          allowNull: false,
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
    ).then(function(){

      return queryInterface.addIndex(
        'listPeople', ['teamId']
      ).then(function(){

        return queryInterface.addIndex(
          'listPeople', ['personGuid'], {
            indexName: 'personGuidIndex'
          }
        ).then(function(){

          return queryInterface.addIndex(
            'listPeople', ['listId'], {
              indexName: 'listIdIndex'
            }
          ).then(function(){

            return queryInterface.addIndex(
              'listPeople', ['listId', 'personGuid'], {
                indicesType: 'UNIQUE'
              }
            );

          });
        });
      });
    });

  },

  down: function(queryInterface, Sequelize){
    queryInterface.deleteTable('listPeople');
  }
};
