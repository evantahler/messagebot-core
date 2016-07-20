var validTypes = ['simple', 'recurring', 'trigger'];

module.exports = function(sequelize, DataTypes){
  return sequelize.define('list', {
    'teamId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'folder': {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    'type': {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        validTypes: function(value){
          if(validTypes.indexOf(value) < 0){
            throw new Error('type is invalid');
          }
        }
      }
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

    'peopleCount': {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    'peopleCountedAt': {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    instanceMethods: {
      validTypes: function(){
        return validTypes;
      },

      apiData: function(api){
        return {
          id:           this.id,
          name:         this.name,
          folder:       this.folder,
          type:         this.type,

          personQuery:  this.personQuery,
          eventQuery:   this.eventQuery,
          messageQuery: this.messageQuery,

          peopleCount:     this.peopleCount,
          peopleCountedAt: this.peopleCountedAt,

          createdAt:    this.createdAt,
          updatedAt:    this.updatedAt,
        };
      }
    }
  });
};
