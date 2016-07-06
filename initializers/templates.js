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

    api.template.expandDate = function(d){
      var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];

      return {
        string: d.toString(),
        date: d.getDate(),
        day: d.getDay(),
        fullYear: d.getFullYear(),
        hours: d.getHours(),
        milisseconds: d.getMilliseconds(),
        minutes: d.getMinutes(),
        monthName: monthNames[d.getMonth()],
        month: (d.getMonth() + 1),
        seconds: d.getSeconds(),
        time: d.getTime(),
        timezoneOffset: d.getTimezoneOffset(),
        // UTCDate: d.getUTCDate(),
        // UTCDay: d.getUTCDay(),
        // UTCFullYear: d.getUTCFullYear(),
        // UTCHours: d.getUTCHours(),
        // UTCMilliseconds: d.getUTCMilliseconds(),
        // UTCMinutes: d.getUTCMinutes(),
        // UTCMonth: d.getUTCMonth(),
        // UTCSeconds: d.getUTCSeconds(),
        // year: d.getYear(),
      }
    };

    api.template.buildView = function(person, events, template){
      var view = {}

      // beacon
      view.beacon = '<img src="';
      view.beacon += api.config.messagebot.url + '/api/message/track.gif?';
      view.beacon += 'verb=read&';
      view.beacon += 'guid=%%MESSAGEGUID%%';
      view.beacon += '" >';

      view.track = function(){
        return function(val, render) {
          var trackingURL = ''
          trackingURL += api.config.messagebot.url + '/api/message/track.gif?';
          trackingURL += 'verb=act&';
          trackingURL += 'guid=%%MESSAGEGUID%%&';
          trackingURL += 'link=' + render(val);
          return trackingURL;
        }
      }

      // person
      view.person = person.data;
      view.person.createdAt = api.template.expandDate(view.person.createdAt);
      view.person.updatedAt = api.template.expandDate(view.person.updatedAt);
      Object.keys(view.person.data).forEach(function(k){
        if(view.person.data[k] instanceof Date){
          view.person.data[k] = api.template.expandDate(view.person.data[k]);
        }
      });

      // events
      view.events = events;

      // template
      view.template = template.apiData(api);
      delete view.template.template;
      view.template.createdAt = api.template.expandDate(view.template.createdAt);
      view.template.updatedAt = api.template.expandDate(view.template.updatedAt);

      // time
      view.now = api.template.expandDate(new Date());
      return view;
    };

    api.template.renderToDisk = function(templateId, personGuid, message, callback){
      api.models.template.findOne({where: {id: templateId}}).then(function(template){
        if(!template){ return callback(new Error('template not found')); }
        if(!template.template || template.template.length === 0 ){ return callback(new Error('template empty')); }

        var person = new api.models.person(personGuid);
        var events = []; //TODO: Do we load in the events?  How many?
        person.hydrate(function(error){
          if(error){ return callback(error); }

          var view = api.template.buildView(person, events, template);

          try{
            var fileBase = 'render/' + uuid.v4() + '.html';
            var file = path.normalize(api.config.messagebot.tmpPath) + '/' + fileBase;
            var html = mustache.render(template.template, view);
            if(message){ html = html.replace(/%%MESSAGEGUID%%/g, message.data.guid); }
          }catch(e){
            return callback(e);
          }

          fs.writeFile(file, html, function(error){
            if(error){ return callback(error); }
            var logData = {}
            if(message){ logData = {messageGuid: message.data.guid} }
            api.log('rendered template #' + template.id + ' for person #' + person.data.guid + ' to ' + file, 'info', logData);
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
