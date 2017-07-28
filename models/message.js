var Sequelize = require('sequelize')
var uuid = require('uuid')

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
          defaultValue: () => { return uuid.v4() }
        },
        teamId: {
          allowNull: false,
          type: Sequelize.BIGINT
        },

        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'campaignId': {
          type: Sequelize.BIGINT,
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
        hooks: {
          beforeCreate: (self) => { return api.sequelize.updatateData(self, api.models.MessageData, 'messageGuid') },
          beforeUpdate: (self) => { return api.sequelize.updatateData(self, api.models.MessageData, 'messageGuid') },
          beforeDestroy: function (self) { return api.models.MessageData.destroy({where: {messageGuid: self.guid}}) }
        },

        instanceMethods: {
          hydrate: function (callback) {
            this.data = {}
            var self = this
            api.models.MessageData.findAll({where: {messageGuid: self.guid}}).then(function (datas) {
              datas.forEach(function (d) { self.data[d.key] = d.value })
              callback(null, datas)
            }).catch(callback)
          },

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

              data: this.data || {},

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
