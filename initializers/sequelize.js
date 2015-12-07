var path              = require('path');
var fs                = require('fs');
var Sequelize         = require('sequelize');

module.exports = {
  loadPriority:  100,
  startPriority: 100,

  initialize: function(api, next){
    api.models = api.models || {};

    var sequelizeInstance = new Sequelize(
      api.config.sequelize.database,
      api.config.sequelize.username,
      api.config.sequelize.password,
      api.config.sequelize
    );

    api.sequelize = {

      sequelize: sequelizeInstance,

      connect: function(callback){
        var dir = path.normalize(api.projectRoot + '/models');
        fs.readdirSync(dir).forEach(function(file){
          var nameParts = file.split("/");
          var name = nameParts[(nameParts.length - 1)].split(".")[0];
          api.models[name] = api.sequelize.sequelize.import(dir + '/' + file);
        });

        if(api.config.sequelize.toSync === true){
          api.sequelize.sequelize.sync().then(function(){
            callback();
          }).catch(function(error){
            callback(error);
          });
        }else{
          callback();
        }
      },

      test: function(callback){
        api.models.user.count().then(function(data){
          api.log('connected to sequelize');
          callback();
        }).catch(function(error){
          api.log('cannot connect to sequelize:', 'crit');
          api.log(error, 'crit');
          callback(error);
        });
      },

      query: function(q, type, callback){
        if(typeof type === 'function'){ callback = type; type = null; }
        if(!type){ type = api.sequelize.sequelize.QueryTypes.SELECT; }
        
        api.sequelize.sequelize.query(q, {type: type}).then(function(users){
          callback(null, users);
        }).catch(callback);
      },

    };

    next();
  },

  start: function(api, next){
    api.sequelize.connect(function(error){
      if(error){ return next(error); }
      api.sequelize.test(next);
    });
  }
};