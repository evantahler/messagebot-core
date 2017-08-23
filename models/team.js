const Sequelize = require('sequelize')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  let destorySettings = function (team) {
    return api.models.Setting.destroy({
      where: { teamGuid: team.guid }
    })
  }

  /* --- Public Model --- */

  return {
    name: 'Team',
    model: api.sequelize.sequelize.define('team',
      {
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: () => { return uuid.v4() }
        },
        'name': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'trackingDomainRegexp': {
          type: Sequelize.STRING,
          allowNull: false
          // TODO: We can't actually unserailze this proeprly...
          // set: function(value){
          //   this.setDataValue('trackingDomainRegexp', value.toString());
          // },
          // get: function(){
          //   let value = this.getDataValue('trackingDomainRegexp');
          //   return new RegExp(value);
          // }
        },
        'trackingDomain': {
          type: Sequelize.STRING,
          allowNull: false
        }
      },

      {
        hooks: {
          afterCreate: (self) => { api.teams.ensureSettingsPrommise(self) },
          afterUpdate: (self) => { api.teams.ensureSettingsPrommise(self) },
          afterSave: (self) => { api.teams.ensureSettingsPrommise(self) },
          afterUpsert: (self) => { api.teams.ensureSettingsPrommise(self) },
          afterDestroy: (self) => { destorySettings(self) }
        },

        instanceMethods: {
          apiData: function () {
            return {
              guid: this.guid,
              name: this.name,
              trackingDomainRegexp: this.trackingDomainRegexp,
              trackingDomain: this.trackingDomain,
              createdAt: this.createdAt,
              updatedAt: this.updatedAt
            }
          }
        }
      }
    )
  }
}

module.exports = loader
