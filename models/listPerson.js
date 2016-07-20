var Sequelize = require('sequelize');

var loader = function(api){
  return {

    /*--- Priave Methods ---*/

    /*--- Public Model ---*/

    name: 'listPerson',
    model: api.sequelize.sequelize.define('listPerson',
      {
        'teamId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        'listId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        'personGuid': {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        instanceMethods: {
          apiData: function(api){
            return {
              id:           this.id,
              listId:       this.listId,
              personGuid:   this.personGuid,
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
