var mkdirp   = require('mkdirp');
var fs       = require('fs');
var glob     = require('glob');
var path     = require('path');
var uuid     = require('node-uuid');
var mustache = require('mustache');

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
        if(!template.template || template.template.length === 0 ){ return callback(new Error('template empty')); }

        var person = new api.models.person(userGuid);
        person.hydrate(function(error){
          if(error){ return callback(error); }

          //TODO: Do we load in the events?  How many?

          var view = {};
          view.person = person.data;
          view.template = template;
          view.now = new Date;

          var fileBase = 'render/' + uuid.v4() + '.html';
          var file = path.normalize(api.config.messagebot.tmpPath) + '/' + fileBase;
          var html = mustache.render(template.template, view);

          fs.writeFile(file, html, function(error){
            if(error){ return callback(error); }
            api.log('rendered template #' + template.id + ' for person #' + person.data.guid + ' to ' + file);
            callback(null, file, fileBase, view);
          });
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
