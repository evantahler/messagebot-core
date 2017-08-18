const Sequelize = require('sequelize')
// const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  /* --- Public Model --- */

  return {
    name: 'Message',

    model: api.sequelize.sequelize.define('message',
      {
        // guid: {
        //   type: Sequelize.UUID,
        //   primaryKey: true,
        //   defaultValue: () => { return uuid.v4() }
        // },
        teamId: {
          allowNull: false,
          type: Sequelize.BIGINT
        },

        'personGuid': {
          type: Sequelize.UUID,
          allowNull: false
        },
        'campaignGuid': {
          type: Sequelize.UUID,
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
          beforeDestroy: (self) => { return api.models.MessageData.destroy({where: {messageGuid: self.guid}}) }
        },

        instanceMethods: {
          hydrate: function (callback) {
            this.data = {}
            let self = this
            api.models.MessageData.findAll({where: {messageGuid: self.guid}}).then((datas) => {
              datas.forEach((d) => { self.data[d.key] = d.value })
              callback(null, datas)
            }).catch(callback)
          },

          apiData: function () {
            return {
              guid: this.guid,
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
