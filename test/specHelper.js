var actionheroPrototype = require('actionhero').actionheroPrototype;
var async   = require('async');
var should  = require('should');
var request = require('request');
var exec    = require('child_process').exec;

var specHelper = {
  actionhero: new actionheroPrototype(),
  api: null,

  doBash: function(commands, callback, silent){
    if(!silent){ silent = false; }
    if(!Array.isArray(commands)){ commands = [commands]; }
    var fullCommand = '/bin/bash -c \'' + commands.join(' && ') + '\'';
    if(!silent){ console.log('>> ' + fullCommand); }
    exec(fullCommand, callback);
  },

  doMySQLBash: function(cmd, callback){
    var self = this;

    // TODO: this assumes mySQL
    if(self.api.config.sequelize.dialect !== 'mysql'){ return callback(new Error('I only know how to work with mySQL')); }
    var command = 'mysql';
    if(self.api.config.sequelize.username){ command += ' -u ' + self.api.config.sequelize.username; }
    if(self.api.config.sequelize.password){ command += ' -p' + self.api.config.sequelize.password; }
    if(self.api.config.sequelize.host){ command += ' -h ' + self.api.config.sequelize.host; }
    if(self.api.config.sequelize.port){ command += ' --port ' + self.api.config.sequelize.port; }
    command += ' -e "' + cmd + '"';
    self.doBash(command, callback);
  },

  doElasticSearchBash: function(verb, pattern, callback){
    var self = this;

    var command = 'curl';
    command += ' -X ' + verb;
    command += ' ' + self.api.config.elasticsearch.urls[0];
    command += '/' + pattern;
    self.doBash(command, callback);
  },

  migrate: function(callback){
    var self = this;
    var jobs = [];

    console.log('\r\n*** MIGRATIING TEST DATABASES ***\r\n');

    jobs.push(function(done){
      if(self.api){ return done(); }
      self.initialize(done);
    });

    jobs.push(function(done){
      self.doMySQLBash('create database if not exists messagebot_test', done);
    });

    jobs.push(function(done){
      self.doBash('NODE_ENV=test npm run migrate:sequelize', done);
    });

    jobs.push(function(done){
      self.doBash('NODE_ENV=test NUMBER_OF_SHARDS=1 npm run migrate:elasticsearch', done);
    });

    jobs.push(function(done){
      console.log('\r\n*** TEST DATABASES MIGRATED***\r\n');
      done();
    });

    async.series(jobs, callback);
  },

  clear: function(callback){
    var self = this;
    var jobs = [];

    console.log('\r\n*** CLEARING TEST DATABASES ***\r\n');

    jobs.push(function(done){
      if(self.api){ return done(); }
      self.initialize(done);
    });

    jobs.push(function(done){
      self.doMySQLBash('drop database if exists messagebot_test', done);
    });

    jobs.push(function(done){
      self.doElasticSearchBash('DELETE', '*-test-*', done);
    });

    jobs.push(function(done){
      console.log('\r\n*** TEST DATABASES CLEARED***\r\n');
      done();
    });

    async.series(jobs, callback);
  },

  initialize: function(callback){
    var self = this;
    self.actionhero.initialize(function(error, a){
      self.api = a;
      callback(error);
    });
  },

  start: function(callback){
    var self = this;
    self.actionhero.start(function(error, a){
      console.log('*** ActionHero Started (test) ***');
      self.api = a;
      callback(error, self.api);
    });
  },

  stop: function(callback){
    var self = this;
    self.actionhero.stop(function(error){
      console.log('*** ActionHero Stopped (test) ***');
      callback(error);
    });
  },

  refresh: function(callback){
    var self = this;
    self.doBash('curl -X POST http://localhost:9200/_refresh?wait_for_ongoing', callback, true);
  },

  flush: function(callback){
    var self = this;
    self.doBash('curl -X POST http://localhost:9200/_flush?wait_for_ongoing', callback, true);
  },

  ensureWrite: function(testName, callback){
    var self = this;
    var counter = 0;
    var sleepAndWrite = function(totalSeconds, callback){
      if(counter >= totalSeconds){ console.log(''); return callback(); }
      process.stdout.write('.');
      setTimeout(function(){ sleepAndWrite(totalSeconds, callback); }, 1000);
      counter++;
    };

    async.series([
      function(done){ self.flush(done); },
      function(done){ self.refresh(done); },
      // TOOD: Why doesn't FLUSH + REFERSH force index to be in sync?
      function(done){ console.log(''); done(); },
      function(done){ process.stdout.write('>> sleeping for commit (' + testName + ')'); done(); },
      function(done){ sleepAndWrite(10, done); },
      function(done){ process.nextTick(done); },
    ], callback);
  },

  login: function(jar, email, password, callback){
    var self = this;
    request.post({
      url: 'http://' + self.api.config.servers.web.bindIP + ':' + self.api.config.servers.web.port + '/api/session',
      jar: jar,
      form: { email: email, password: password }
    }, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.success.should.equal(true);
      body.user.email.should.equal(email);

      callback(null);
    });
  },

  requestWithLogin: function(email, password, route, verb, params, callback){
    var self = this;
    var jar = request.jar();
    self.login(jar, email, password, function(error){
      if(error){ return callback(error); }

      if(verb === 'get'){
        route += '?';
        for(var key in params){ route += key + '=' + params[key] + '&'; }
      }

      var url = 'http://' + self.api.config.servers.web.bindIP + ':' + self.api.config.servers.web.port + route;

      request[verb]({
        url: url,
        jar: jar,
        form: params
      }, function(error, data, response){
        if(error){ return callback(error); }
        return callback(error, JSON.parse(response));
      });
    });
  },
};

/*--- Always Clear and Migrate before eacn run ---*/

if(process.env.SKIP_MIGRATE !== 'true'){
  before(function(done){ specHelper.clear(done); });
  before(function(done){ specHelper.migrate(done); });
}

/*--- Start up the server ---*/
before(function(done){ specHelper.start(done); });
after(function(done){ specHelper.stop(done); });

module.exports = specHelper;
