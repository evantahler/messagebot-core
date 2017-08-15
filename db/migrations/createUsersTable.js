module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
      'users',
      {
        id: {
          type: Sequelize.BIGINT,
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
          type: Sequelize.BIGINT,
          allowNull: false
        },

        'email': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'passwordHash': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'role': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'new'
        },
        'firstName': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'lastName': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'lastLoginAt': {
          type: Sequelize.DATE,
          allowNull: true
        }
      }
    ).then(() => {
      return queryInterface.addIndex(
        'users', ['teamId']
      ).then(() => {
        return queryInterface.addIndex(
          'users', ['email'], {
            indexName: 'emailUniqueIndex',
            indicesType: 'UNIQUE'
          }
        ).then(() => {
          return queryInterface.addIndex(
            'users', ['personGuid'], {
              indexName: 'personGuidUniqueIndex',
              indicesType: 'UNIQUE'
            }
          )
        })
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.deleteTable('users')
  }
}
