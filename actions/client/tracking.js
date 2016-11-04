var async = require('async');
var fs    = require('fs');

var prepareFile = function(api, data, file, mime, next){
  var jobs = [];
  var settings = {};
  var source = '';

  jobs.push(function(done){
    api.models.setting.findAll({where: {teamId: data.team.id}}).then(function(_settings){
      settings = _settings;
      done();
    }).catch(done);
  });

  jobs.push(function(done){
    fs.readFile(file, function(error, _source){
      if(error){ return done(error); }
      source = _source.toString();
      done();
    });
  });

  jobs.push(function(done){
    source = source.replace(/%%TRACKINGDOMAIN%%/g, data.team.trackingDomain);
    source = source.replace(/%%TEAMID%%/g, data.team.id);
    source = source.replace(/%%APIROUTE%%/g, api.config.servers.web.urlPathForActions);
    done();
  });

  jobs.push(function(done){
    var settingJobs = [];
    settings.forEach(function(setting){
      settingJobs.push(function(settingsDone){
        var key = setting.key.toUpperCase();
        var regexp = new RegExp('%%' + key + '%%', 'g');
        source = source.replace(regexp, setting.value);
        settingsDone();
      });
    });
    async.series(settingJobs, done);
  });

  jobs.push(function(done){
    data.response = source;
    data.connection.rawConnection.responseHeaders.push(['Content-type', mime]);
    done();
  });

  async.series(jobs, next);
};

exports.client = {
  name:                   'tracking:client',
  description:            'tracking:client',
  outputExample:          {},
  middleware:             ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
  },

  run: function(api, data, next){
    var file = __dirname + '/../../client/web.js';
    prepareFile(api, data, file, 'application/javascript', next);
  }
};

exports.subscriptions = {
  name:                   'tracking:subscriptions',
  description:            'tracking:subscriptions',
  outputExample:          {},
  middleware:             ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
  },

  run: function(api, data, next){
    var file = __dirname + '/../../client/subscriptions.html';
    prepareFile(api, data, file, 'text/html', next);
  }
};
