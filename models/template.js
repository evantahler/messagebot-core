module.exports = function(sequelize, DataTypes){
  return sequelize.define("template", {
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'description': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'folder': {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    'transport': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'template': {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    instanceMethods: {
      apiData: function(api){
        return {
          id:           this.id,

          name:         this.name,
          description:  this.description,
          folder:       this.folder,
          transport:    this.transport,
          template:     this.template,

          createdAt:    this.createdAt,
          updatedAt:    this.updatedAt,
        };
      }
    }
  });
};
