module.exports = {
  up: function(queryInterface, Sequelize){
    return queryInterface.createTable(
      'teams',
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
        'trackingDomainRegexp': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'trackingDomain': {
          type: Sequelize.STRING,
          allowNull: false,
        }

      }
    ).then(function(){

      return queryInterface.addIndex(
        'teams', ['name'], {
          indicesType: 'UNIQUE'
        }
      ).then(function(){

        return queryInterface.addIndex(
          'teams', ['trackingDomainRegexp'], {
            indicesType: 'UNIQUE'
          }
        ).then(function(){

          return queryInterface.addIndex(
            'teams', ['trackingDomain'], {
              indicesType: 'UNIQUE'
            }
          );

        });
      });
    });

  },

  down: function(queryInterface, Sequelize){
    queryInterface.createTable('teams');
  }
};
