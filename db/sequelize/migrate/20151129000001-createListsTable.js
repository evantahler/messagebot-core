module.exports = {
  up: function (queryInterface, Sequelize) {
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

        'name': {
          type: Sequelize.STRING,
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
      'lists', ['name'],{
        indexName: 'nameUniqueIndex',
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.createTable('lists');
  }
};
