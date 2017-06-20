var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'Message',

    model: api.sequelize.sequelize.define('message',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        teamId: {
          type: Sequelize.INTEGER
        },

        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'campaignId': {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        'transport': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'body': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'sentAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'readAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'actedAt': {
          type: Sequelize.DATE,
          allowNull: true
        }
      },
      {
        instanceMethods: {
          apiData: function () {
            return {
              guid: this.guid,
              teamId: this.teamId,
              personGuid: this.personGuid,
              campaignId: this.campaignId,
              transport: this.transport,
              body: this.body,
              sentAt: this.sentAt,
              readAt: this.readAt,
              actedAt: this.actedAt,

              updatedAt: this.updatedAt,
              createdAt: this.createdAt
            }
          }
        }
      }
    )
  }
}

module.exports = loader
