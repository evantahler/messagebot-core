module.exports = function(sequelize, DataTypes){
  return sequelize.define("list", {
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'folder': {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },

    'personQuery': {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    'eventQuery': {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    'messageQuery': {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    instanceMethods: {
      apiData: function(api){
        return {
          id:           this.id,
          name:         this.name,
          folder:       this.folder,
          personQuery:  this.personQuery,
          eventQuery:   this.eventQuery,
          messageQuery: this.messageQuery,
          createdAt:    this.createdAt,
          updatedAt:    this.updatedAt,
        };
      }
    }
  });
};
