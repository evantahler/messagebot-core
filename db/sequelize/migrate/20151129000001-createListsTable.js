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


        'type': {
          type: Sequelize.STRING,
          allowNull: false,
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
