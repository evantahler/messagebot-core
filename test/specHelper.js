var actionheroPrototype = require('actionhero').actionheroPrototype;
var async   = require('async');
var should  = require('should');
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
      self.api = a;
      callback(error, self.api);
    });
  },

  stop: function(callback){
    var self = this;
    self.actionhero.stop(function(error){
      callback(error);
    });
  },

  login: function(connection, email, password, callback){
    var self = this;
    connection.params = {
      email: email,
      password: password
    };

    self.api.specHelper.runAction('session:create', connection, callback);
  },

  requestWithLogin: function(email, password, action, params, callback){
    var self = this;
    var connection = new self.api.specHelper.connection();
    self.login(connection, email, password, function(loginResponse){
      if(loginResponse.error){ return callback(loginResponse); }
      connection.params = params;
      self.api.specHelper.runAction(action, connection, callback);
    });
  },
};

/*--- Always Clear and Migrate before eacn run ---*/

if(process.env.SKIP_MIGRATE !== 'true'){
  before(function(done){
    this.timeout(10 * 1000);
    specHelper.clear(done);
  });

  before(function(done){
    this.timeout(10 * 1000);
    specHelper.migrate(done);
  });
}

/*--- Start up the server ---*/
before(function(done){
  this.timeout(10 * 1000);
  specHelper.start(done);
});

after(function(done){
  this.timeout(10 * 1000);
  specHelper.stop(done);
});

module.exports = specHelper;
