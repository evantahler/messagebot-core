module.exports = {
  up: function(queryInterface, Sequelize){
    queryInterface.createTable(
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
    );

    queryInterface.addIndex(
      'teams', ['name'], {
        indicesType: 'UNIQUE'
      }
    );

    queryInterface.addIndex(
      'teams', ['trackingDomainRegexp'], {
        indicesType: 'UNIQUE'
      }
    );

    queryInterface.addIndex(
      'teams', ['trackingDomain'], {
        indicesType: 'UNIQUE'
      }
    );

    queryInterface.bulkInsert('teams', [
      {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'MessageBot',
        trackingDomainRegexp: '^.*$',
        trackingDomain: 'https://tracking.site.com',
      },
    ]);
  },

  down: function(queryInterface, Sequelize){
    queryInterface.createTable('teams');
  }
};
