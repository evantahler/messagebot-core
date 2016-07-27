var bcrypt = require('bcrypt');
var bcryptComplexity = 10;

module.exports = {
  up: function(queryInterface, Sequelize){

    return queryInterface.bulkInsert('users', [
      {
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
