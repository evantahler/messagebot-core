module.exports = {
  up: function(queryInterface, Sequelize){
    return queryInterface.createTable(
      'settings',
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

        'key': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'value': {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'description': {
          type: Sequelize.TEXT,
          allowNull: false,
        }
      }
    ).then(function(){

      return queryInterface.addIndex(
        'settings', ['teamId']
      ).then(function(){

        return queryInterface.addIndex(
          'settings', ['teamId', 'key'], {
            indicesType: 'UNIQUE'
          }
        );

      });
    });

  },

  down: function(queryInterface, Sequelize){
    queryInterface.deleteTable('settings');
  }
};
