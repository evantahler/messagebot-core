'use strict';

var ChildProcess = require('child_process');

exports.task = {
  name:          'system:elasticsearchMigration',
  description:   'system:elasticsearchMigration',
  frequency:     (1000 * 60 * 60 * 24),
  queue:         'messagebot:system',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var output = [];
    var fork = ChildProcess.fork(__dirname + '/../../db/elasticsearch/teamSeeder.js');
    fork.on('data',  function(d){      output.push(d);     });
    fork.on('error', function(errror){ next(errror);       });
    fork.on('close', function(){       next(null, output); });
  }
};
