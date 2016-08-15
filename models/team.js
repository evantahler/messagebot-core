var Sequelize = require('sequelize');

var loader = function(api){

  /*--- Priave Methods ---*/

  // This will signal all nodes in the cluster to reload thier teams cache
  //  and rebuild the client JS files
  var reloadTeams = function(){
    api.redis.doCluster('api.teams.load', null, null, function(error){
      if(error){ throw(error); }
    });
  };

  /*--- Public Model ---*/

  return {
    name: 'team',
    model: api.sequelize.sequelize.define('team',
      {
        'name': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'trackingDomainRegexp': {
          type: Sequelize.STRING,
          allowNull: false,
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
          allowNull: false,
        },
      },

      {
        hooks: {
          afterCreate:  function(){ reloadTeams(); },
          afterDestroy: function(){ reloadTeams(); },
          afterUpdate:  function(){ reloadTeams(); },
          afterSave:    function(){ reloadTeams(); },
          afterUpsert:  function(){ reloadTeams(); },
        },

        instanceMethods: {
          apiData: function(){
            return {
              id:        this.id,
              name:      this.name,
              trackingDomainRegexp: this.trackingDomainRegexp,
              trackingDomain: this.trackingDomain,
              createdAt: this.createdAt,
              updatedAt: this.updatedAt,
            };
          }
        }
      }
    )
  };

};

module.exports = loader;
