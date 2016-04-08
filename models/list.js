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
      get: function(){
        var q = this.getDataValue('personQuery');
        if(q && q.length > 0){
          return JSON.parse(q);
        }else{
          return q;
        }
      },
      set: function(q){
        if(q && typeof q !== 'string'){
          q = JSON.stringify(q);
        }
        this.setDataValue('personQuery', q);
      }
    },
    'eventQuery': {
      type: DataTypes.TEXT,
      allowNull: true,
      get: function(){
        var q = this.getDataValue('eventQuery');
        if(q && q.length > 0){
          return JSON.parse(q);
        }else{
          return q;
        }
      },
      set: function(q){
        if(q && typeof q !== 'string'){
          q = JSON.stringify(q);
        }
        this.setDataValue('eventQuery', q);
      }
    },
    'messageQuery': {
      type: DataTypes.TEXT,
      allowNull: true,
      get: function(){
        var q = this.getDataValue('messageQuery');
        if(q && q.length > 0){
          return JSON.parse(q);
        }else{
          return q;
        }
      },
      set: function(q){
        if(q && typeof q !== 'string'){
          q = JSON.stringify(q);
        }
        this.setDataValue('messageQuery', q);
      }
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
