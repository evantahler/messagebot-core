var Sequelize = require('sequelize')

var loader = function (api) {
  /* --- Priave Methods --- */

  var destorySettings = function (team) {
    return api.models.Setting.destroy({
      where: { teamId: team.id }
    })
  }

  /* --- Public Model --- */

  return {
    name: 'Team',
    model: api.sequelize.sequelize.define('team',
      {
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
          //   var value = this.getDataValue('trackingDomainRegexp');
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
              id: this.id,
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
