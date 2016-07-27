module.exports = {
  up: function(queryInterface, Sequelize){

    return queryInterface.bulkInsert('teams', [
      {
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'MessageBot',
        trackingDomainRegexp: '^.*$',
        trackingDomain: 'https://tracking.site.com',
      },
    ]);

  }
};
