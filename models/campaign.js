var validTypes = ['simple', 'recurring', 'trigger'];

module.exports = function(sequelize, DataTypes){
  return sequelize.define('campaign', {
    'teamId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'name': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'description': {
      type: DataTypes.STRING,
      allowNull: false,
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
    'folder': {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    'transport': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'listId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'templateId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'campaignVariables': {
      type: DataTypes.TEXT,
      allowNull: true,
      get: function(){
        var q = this.getDataValue('campaignVariables');
        if(q && q.length > 0){
          return JSON.parse(q);
        }else{
          return {};
        }
      },
      set: function(q){
        if(q && typeof q !== 'string'){
          q = JSON.stringify(q);
        }
        this.setDataValue('campaignVariables', q);
      }
    },

    'sendAt': {
      type: DataTypes.DATE,
      allowNull: true,
    },
    'sendingAt': {
      type: DataTypes.DATE,
      allowNull: true,
    },
    'sentAt': {
      type: DataTypes.DATE,
      allowNull: true,
    },
    'sendOnce': {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    'triggerDelay': {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    'reTriggerDelay': {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

  }, {
    instanceMethods: {
      validTypes: function(){
        return validTypes;
      },

      apiData: function(api){
        return {
          id:                this.id,
          name:              this.name,
          description:       this.description,
          type:              this.type,
          folder:            this.folder,

          transport:         this.transport,
          listId:            this.listId,
          templateId:        this.templateId,
          campaignVariables: this.campaignVariables,

          sendAt:            this.sendAt,
          sendingAt:         this.sendingAt,
          sentAt:            this.sentAt,
          sendOnce:          this.sendOnce,
          triggerDelay:      this.triggerDelay,
          reTriggerDelay:    this.reTriggerDelay,

          createdAt:         this.createdAt,
          updatedAt:         this.updatedAt,
        };
      }
    }
  });
};
