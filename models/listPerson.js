module.exports = function(sequelize, DataTypes){
  return sequelize.define("listPerson", {
    'listId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'userGuid': {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    instanceMethods: {
      apiData: function(api){
        return {
          id:           this.id,
          listId:       this.listId,
          userGuid:     this.userGuid,
          createdAt:    this.createdAt,
          updatedAt:    this.updatedAt,
        };
      }
    }
  });
};
