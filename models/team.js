module.exports = function(sequelize, DataTypes){
  return sequelize.define('team', {
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'trackingDomainRegexp': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'trackingDomain': {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    instanceMethods: {
      apiData: function(api){
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
  });
};
