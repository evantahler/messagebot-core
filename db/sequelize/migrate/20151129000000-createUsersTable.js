module.exports = {
  up: function(queryInterface, Sequelize){
    queryInterface.createTable(
      'users',
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

        'email': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'passwordHash': {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'passwordSalt': {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'personGuid': {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'status': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'new',
        },
        'firstName': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'lastName': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'lastLoginAt': {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }
    );

    queryInterface.addIndex(
      'users', ['email'], {
        indexName: 'emailUniqueIndex',
        indicesType: 'UNIQUE'
      },
      'users', ['personGuid'], {
        indexName: 'personGuidUniqueIndex',
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function(queryInterface, Sequelize){
    queryInterface.deleteTable('users');
  }
};
