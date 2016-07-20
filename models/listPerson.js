module.exports = function(sequelize, DataTypes){
  return sequelize.define('listPerson', {
    'teamId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'listId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'personGuid': {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
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
  });
};
