var bcrypt = require('bcrypt');
var bcryptComplexity = 10;

var validStatuses = [
  'new',
  'disabled',
  'admin',
  'marketer',
  'analyst',
  'developer',
  'designer',
];

module.exports = function(sequelize, DataTypes){
  return sequelize.define('user', {
    'teamId': {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    'email': {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    'passwordHash': {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    'personGuid': {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    'status': {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'new',
      validate: {
        validStatus: function(value){
          if(validStatuses.indexOf(value) < 0){
            throw new Error('status is invalid');
          }
        }
      }
    },
    'firstName': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'lastName': {
      type: DataTypes.STRING,
      allowNull: false,
    },
    'lastLoginAt': {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    instanceMethods: {
      name: function(){
        return [this.firstName, this.lastName].join(' ');
      },

      validStatuses: function(){
        return validStatuses;
      },

      updatePassword: function(pw, callback){
        var self = this;
        bcrypt.hash(pw, bcryptComplexity, function(error, hash){
          if(error){ return callback(error); }
          self.passwordHash = hash;
          callback(null, self);
        });
      },

      checkPassword: function(pw, callback){
        var self = this;
        bcrypt.compare(pw, self.passwordHash, callback);
      },

      apiData: function(api){
        return {
          id:         this.id,
          personGuid: this.personGuid,
          email:      this.email,
          status:     this.status,
          firstName:  this.firstName,
          lastName:   this.lastName,
        };
      }
    }
  });
};
