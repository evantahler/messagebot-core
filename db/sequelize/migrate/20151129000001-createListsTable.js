module.exports = {
  up: function(queryInterface, Sequelize){
    queryInterface.createTable(
      'lists',
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
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default',
        },
        'type': {
          type: Sequelize.STRING,
          allowNull: false,
        },

        'personQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        'eventQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        'messageQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
        },

        'peopleCount': {
          type: Sequelize.INTEGER,
          allowNull: false,
          default: 0,
        },
        'peopleCountedAt': {
          type: Sequelize.DATE
        },
      }
    );

    queryInterface.addIndex(
      'lists', ['teamId']
    );

    queryInterface.addIndex(
      'lists', ['teamId', 'name'], {
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function(queryInterface, Sequelize){
    queryInterface.deleteTable('lists');
  }
};
