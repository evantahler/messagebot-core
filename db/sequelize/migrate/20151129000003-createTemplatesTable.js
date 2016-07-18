module.exports = {
  up: function(queryInterface, Sequelize){
    queryInterface.createTable(
      'templates',
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

        'name': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'description': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default',
        },
        'transport': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'template': {
          type: Sequelize.TEXT,
          allowNull: true,
        }
      }
    );

    queryInterface.addIndex(
      'templates', ['teamId'],
      'templates', ['name'], {
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function(queryInterface, Sequelize){
    queryInterface.deleteTable('templates');
  }
};
