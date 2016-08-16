var Sequelize    = require('sequelize');
var sanitizeHtml = require('sanitize-html');
var uuid         = require('node-uuid');
var mustache     = require('mustache');
var async        = require('async');

var loader = function(api){

  /*--- Priave Methods ---*/

  var allowedTags = [
    'html', 'body',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre',
    'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em',
    'strike', 'code',
    'hr', 'br', 'div', 'span', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td',
  ];

  var expandDate = function(d){
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    };
  };

  var buildView = function(team, person, events, template){
    var view = {};

    // beacon
    view.beaconLink = team.trackingDomain + '/api/message/track.gif?';
    view.beaconLink += 'verb=read&';
    view.beaconLink += 'guid=%%MESSAGEGUID%%';

    view.beacon = '<img src="';
    view.beacon += view.beaconLink;
    view.beacon += '" >';

    view.track = function(){
      return function(val, render){
        var trackingURL = '';
        trackingURL += team.trackingDomain + '/api/message/track.gif?';
        trackingURL += 'verb=act&';
        trackingURL += 'guid=%%MESSAGEGUID%%&';
        trackingURL += 'link=' + render(val);
        return trackingURL;
      };
    };

    view.include = function(){
      return function(val, render){
        return '%%TEMPLATEINCLUDE:' + val + '%%';
      };
    };

    // person
    view.person = Object.assign({}, person.data);
    view.person.createdAt = expandDate(view.person.createdAt);
    view.person.updatedAt = expandDate(view.person.updatedAt);
    Object.keys(view.person.data).forEach(function(k){
      if(view.person.data[k] instanceof Date){
        view.person.data[k] = expandDate(view.person.data[k]);
      }
    });

    // events
    view.events = events;

    // template
    view.template = template.apiData();
    delete view.template.template;
    view.template.createdAt = expandDate(view.template.createdAt);
    view.template.updatedAt = expandDate(view.template.updatedAt);

    // time
    view.now = expandDate(new Date());
    return view;
  };

  /*--- Public Model ---*/

  return {
    name: 'template',
    model: api.sequelize.sequelize.define('template',
      {
        'teamId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        'name': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'description': {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default',
        },
        'template': {
          type: Sequelize.TEXT,
          allowNull: true,
          set: function(q){
            this.setDataValue('template', sanitizeHtml(q, {
              allowedTags: allowedTags,
              allowedAttributes: false
            }));
          }
        }
      },

      {
        instanceMethods: {

          render: function(person, message, callback, includedIds){
            var template = this;
            var jobs     = [];
            var events   = []; //TODO: Do we load in the events?  How many?
            var team;
            var person;
            var view;
            var html;

            if(!template.template || template.template.length === 0){ return callback(new Error('template empty')); }

            // Recusion saftey!
            if(!includedIds){ includedIds = []; }
            if(includedIds.indexOf(template.id) >= 0){ return callback(new Error('Cannot include template into itself')); }
            includedIds.push(template.id);

            jobs.push(function(done){
              api.models.team.findOne({where: {id: template.teamId}}).then(function(t){
                team = t;
                if(!team){ return done(new Error('team not found')); }
                return done();
              }).catch(done);
            });

            jobs.push(function(done){
              view = buildView(team, person, events, template);
              done();
            });

            jobs.push(function(done){
              try{
                html = mustache.render(template.template, view);
                if(message){
                  html            = html.replace(/%%MESSAGEGUID%%/g, message.data.guid);
                  view.beaconLink = view.beaconLink.replace(/%%MESSAGEGUID%%/g, message.data.guid);
                  view.beacon     = view.beacon.replace(/%%MESSAGEGUID%%/g, message.data.guid);
                }
                done();
              }catch(e){
                return done(e);
              }
            });

            jobs.push(function(done){
              var includeJobs = [];
              var matches = html.match(/%%TEMPLATEINCLUDE:.*%%/g);
              if(!matches || matches.length === 0){ return done(); }
              matches.forEach(function(match){
                var matcher = match.replace(/%%/g, '').split(':')[1];
                var includedTemplate;

                includeJobs.push(function(includeDone){
                  var or = {name: matcher};
                  if(parseInt(matcher, 10)){ or.id =  parseInt(matcher, 10); }
                  api.models.template.findOne({where: {
                    teamId: team.id,
                    $or: or
                  }}).then(function(_includedTemplate){
                    if(!_includedTemplate){ return includeDone(new Error('Cannot find template to include (' + matcher + ')')); }
                    includedTemplate = _includedTemplate;
                    includeDone();
                  }).catch(includeDone);
                });

                includeJobs.push(function(includeDone){
                  includedTemplate.render(person, message, function(error, includedHtml){
                    if(error){ return includeDone(error); }
                    html = html.replace(match, includedHtml);
                    includeDone();
                  }, includedIds);
                });
              });

              async.series(includeJobs, function(error){
                process.nextTick(function(){ return done(error); });
              });
            });

            async.series(jobs, function(error){
              process.nextTick(function(){
                if(error){ return callback(error); }
                var logData = {};
                if(message){ logData = {messageGuid: message.data.guid}; }
                api.log('rendered template #' + template.id + ' for person #' + person.data.guid, 'info', logData);
                return callback(null, html, view);
              });
            });
          },

          apiData: function(){
            return {
              id:           this.id,

              name:         this.name,
              description:  this.description,
              folder:       this.folder,
              template:     this.template,

              createdAt:    this.createdAt,
              updatedAt:    this.updatedAt,
            };
          }
        }
      }
    )
  };

};

module.exports = loader;
