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
    name: 'setting',

    model: api.sequelize.sequelize.define('setting',
      {
        'teamId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        'key': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'value': {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'description': {
          type: Sequelize.TEXT,
          allowNull: false,
        }
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
              id:           this.id,
              teamId:       this.teamId,
              key:          this.key,
              value:        this.value,
              description:  this.description,
              createdAt:    this.createdAt,
              updatedAt:    this.updatedAt,
            };
          }
        }
      }
    )
  };

};

module.exports = loader;
