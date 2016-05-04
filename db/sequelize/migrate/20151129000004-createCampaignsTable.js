module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable(
      'campaigns',
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
        'description': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'type': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default',
        },
        'transport': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'listId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        'templateId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        'sendAt': {
          type: Sequelize.DATE,
          allowNull: true,
        },
        'sentAt': {
          type: Sequelize.DATE,
          allowNull: true,
        },
        'sendOnce': {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        'triggerDelay': {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        'reTriggerDelay': {
          type: Sequelize.INTEGER,
          allowNull: true,
        },

      }
    );

    queryInterface.addIndex(
      'campaigns', ['name'],{
        indicesType: 'UNIQUE'
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.createTable('campaigns');
  }
};
