module.exports = function(sequelize, DataTypes){
  return sequelize.define('team', {
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'urlRegexp': {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    instanceMethods: {
      apiData: function(api){
        return {
          id:        this.id,
          name:      this.name,
          urlRegexp: this.urlRegexp,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      }
    }
  });
};
