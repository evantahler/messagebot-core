var actionheroPrototype = require('actionhero').actionheroPrototype;
var async   = require('async');
var request = require('request');
var should  = require('should');
var exec    = require('child_process').exec;

var specHelper = {
  actionhero: new actionheroPrototype(),
  api: null,

  doDatabaseBash: function(cmd, callback, silent){
    var self = this;

    if(self.api.config.sequelize.dialect === 'mysql'){
      var command = 'mysql';
      if(self.api.config.sequelize.username){ command += ' -u ' + self.api.config.sequelize.username; }
      if(self.api.config.sequelize.password){ command += ' -p' + self.api.config.sequelize.password; }
      if(self.api.config.sequelize.host){ command += ' -h ' + self.api.config.sequelize.host; }
      if(self.api.config.sequelize.port){ command += ' --port ' + self.api.config.sequelize.port; }
      command += ' -e "' + cmd + '"';
    }else if(self.api.config.sequelize.dialect === 'postgres'){
      var command = 'psql';
      if(self.api.config.sequelize.username){ command += ' --username=' + self.api.config.sequelize.username; }
      if(self.api.config.sequelize.password){ command = ' PGPASSWORD=' + self.api.config.sequelize.password + ' ' + command; }
      if(self.api.config.sequelize.host){ command += ' --host=' + self.api.config.sequelize.host; }
      if(self.api.config.sequelize.port){ command += ' --port=' + self.api.config.sequelize.port; }
      if(self.api.config.sequelize.database){ command += ' --dbname=' + self.api.config.sequelize.database; }
      command += ' -c "' + cmd + '"';
    }
    else{
      return callback(new Error('I do not know how to work with ' + self.api.config.sequelize.dialect));
    }

    self.api.utils.doShell(command, callback, silent);
  },

  createDatabase: function(callback, silent){
    var self = this;
    if(self.api.config.sequelize.dialect === 'postgres'){
      self.api.utils.doShell(['createdb ' + self.api.config.sequelize.database], callback, silent);
    }else{
      self.doDatabaseBash('create database if not exists ' + self.api.config.sequelize.database, callback, silent);
    }
  },

  dropDatabase: function(callback, silent){
    var self = this;

    if(self.api.config.sequelize.dialect === 'postgres'){
      self.api.utils.doShell(['dropdb --if-exists ' + self.api.config.sequelize.database], function(error){
        if(error && !String(error).match(/NOTICE/)){ return callback(error); }
        return callback();
      }, silent);
    }else if(self.api.config.sequelize.dialect === 'mysql'){
      self.doDatabaseBash('drop database if exists ' + self.api.config.sequelize.database, callback, silent);
    }
    else{
      return callback(new Error('I do not know how to drop this type of database: ' + self.api.config.sequelize.dialect));
    }
  },

  doElasticSearchBash: function(verb, pattern, callback, silent){
    var self = this;

    var command = 'curl';
    command += ' -s ';
    command += ' -X ' + verb;
    command += ' ' + self.api.config.elasticsearch.urls[0];
    command += '/' + pattern;
    self.api.utils.doShell(command, callback, silent);
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
      self.createDatabase(done);
    });

    jobs.push(function(done){
      self.api.utils.doShell('NODE_ENV=test npm run migrate:sequelize', done);
    });

    jobs.push(function(done){
      self.api.utils.doShell('NODE_ENV=test NUMBER_OF_SHARDS=1 npm run migrate:elasticsearch', done);
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
      self.dropDatabase(done);
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

  truncate: function(table, callback){
    var self = this;
    if(self.api.config.sequelize.dialect === 'postgres'){ table = '"' + table + '"'; }
    if(self.api.config.sequelize.dialect === 'mysql'){ table = '`' + table + '`'; }
    self.api.sequelize.sequelize.query('truncate table ' + table).then(function(){
      callback();
    }).catch(callback);
  },

  createTeam: function(callback){
    var self = this;
    var command = '';
    command += ' NODE_ENV=test';
    command += ' NUMBER_OF_SHARDS=1';
    command += ' ./bin/messagebot team create';
    command += ' --name TestTeam';
    command += ' --trackingDomainRegexp "^.*$"';
    command += ' --trackingDomain "http://tracking.site.com"';
    command += ' --email "admin@localhost.com"';
    command += ' --password "password"';

    console.log('\r\n*** Creating Test Team ***\r\n');
    self.api.utils.doShell(command, function(error){
      if(error){ console.log('error', error); return callback(error); }
      console.log('\r\n*** Test Team Created ***\r\n');
      return callback();
    }, false);
  },

  flushRedis: function(callback){
    var self = this;
    self.api.redis.clients.tasks.flushdb(callback);
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

  WebRequestWithLogin: function(email, password, verb, route, params, callback){
    var self = this;
    var j = request.jar();
    var baseUrl = 'http://' + self.api.config.servers.web.bindIP + ':' + self.api.config.servers.web.port;
    request.post({
      url: baseUrl + '/api/session',
      jar: j,
      form: {email: email, password: password}
    }, function(error, response, body){
      if(error){ return callback({error: error}); }
      body = JSON.parse(body);
      if(body.error){ return callback(body); }

      var actionUrl = baseUrl + route + '?';
      if(verb === 'get'){
        for(var key in params){ actionUrl += key + '=' + params[key] + '&'; }
      }

      request[verb]({
        url: actionUrl,
        jar: j,
        form: params
      }, function(error, response, body){
        if(error){ return callback({error: error}); }
        try{
          body = JSON.parse(body);
        }catch(e){ }
        return callback(body, response);
      });
    });
  },
};

/*--- Init the server ---*/
before(function(done){
  specHelper.initialize(done);
});

/*--- Always Clear and Migrate before eacn run ---*/

if(process.env.SKIP_MIGRATE !== 'true'){
  console.log('You can set SKIP_MIGRATE=true to skip the migration preperation steps of this test suite');
  before(function(done){
    this.timeout(10 * 1000);
    specHelper.clear(done);
  });

  before(function(done){
    this.timeout(10 * 1000);
    specHelper.migrate(done);
  });

  before(function(done){
    this.timeout(10 * 1000);
    specHelper.createTeam(done);
  });

  before(function(done){
    specHelper.flushRedis(done);
  });
}

/*--- Start up the server ---*/
before(function(done){
  specHelper.start(done);
});

/*--- Stop the server ---*/
after(function(done){
  specHelper.stop(done);
});

module.exports = specHelper;
