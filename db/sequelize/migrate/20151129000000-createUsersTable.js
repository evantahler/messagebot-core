var bcrypt = require('bcrypt');
var bcryptComplexity = 10;

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
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'role': {
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
      'users', ['teamId']
    );

    queryInterface.addIndex(
      'users', ['email'], {
        indexName: 'emailUniqueIndex',
        indicesType: 'UNIQUE'
      }
    );

    queryInterface.addIndex(
      'users', ['personGuid'], {
        indexName: 'personGuidUniqueIndex',
        indicesType: 'UNIQUE'
      }
    );

    queryInterface.bulkInsert('users', [
      {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        teamId: 1,
        email: 'admin@localhost.com',
        passwordHash: bcrypt.hashSync('password', bcryptComplexity),
        personGuid: 0,
        role: 'admin',
        firstName: 'admin',
        lastName: 'admin',
      },
    ]);
  },

  down: function(queryInterface, Sequelize){
    queryInterface.deleteTable('users');
  }
};
