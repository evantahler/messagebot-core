var dateformat = require('dateformat');
var mkdirp     = require('mkdirp');
var fs         = require('fs');
var glob       = require('glob');
var path       = require('path');
var uuid       = require('node-uuid');

var personAlias = function(api){
  return api.env + '-' + 'people';
};

var personIndex = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return alias(api) + '-' + thisMonth;
};

module.exports = {
  initialize: function(api, next){

    api.template = {
      tmpPath: path.normalize(api.config.messagebot.tmpPath + '/render'),
      cleanupTimer: null,
    };

    mkdirp.sync(api.template.tmpPath);

    api.template.cleanup = function(){
      glob(api.template.tmpPath + '/**/*', function(error, files){
        if(error){ api.log(error, 'error'); }
        else{
          files.forEach(function(f){
            fs.stat(f, function(error, stats){
              var age = new Date().getTime() - stats.birthtime.getTime();
              if(age > parseInt(api.config.messagebot.tmpFileLifespan)){
                fs.unlink(f, function(error){
                  if(error){ api.log(error, 'error'); }
                  else{ api.log('deleted tmp file: ' + f); }
                });
              }
            });
          });
        }
      });
    };

    api.template.renderToDisk = function(templateId, userGuid, callback){
      api.models.template.findOne({where: {id: templateId}}).then(function(template){
        if(!template){ return callback(new Error('template not found')); }

        var fileBase = 'render/' + uuid.v4() + '.html';
        var file = path.normalize(api.config.messagebot.tmpPath) + '/' + fileBase;
        var html = template.template;

        fs.writeFile(file, html, function(error){
          if(error){ return callback(error); }
          api.log('rendered template #' + template.id + ' to ' + file);
          callback(null, file, fileBase);
        });
      }).catch(callback);
    }

    next();
  },

  start: function(api, next){
    api.template.cleanupTimer = setInterval(api.template.cleanup, Math.floor(parseInt(api.config.messagebot.tmpFileLifespan) / 2))
    next();
  },

  stop: function(api, next){
    clearTimeout(api.template.cleanupTimer);
    next();
  }
};
