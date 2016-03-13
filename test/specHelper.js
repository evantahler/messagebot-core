var actionheroPrototype = require('actionhero').actionheroPrototype;
var elasticsearchMigrator = require(__dirname + '/../db/elasticsearch/migrate.js').migrate
var async   = require('async');
var should  = require('should');
var request = require('request');

specHelper = {
  actionhero: new actionheroPrototype(),
  api: null,

  startServer: function(callback){
    var self = this;

    self.actionhero.start(function(error, a){
      if(error){throw error;}
      self.api = a;
      callback();
    });
  },

  stopServer: function(callback){
    var self = this;
    self.actionhero.stop(callback);
  },

  rebuildElasticsearch: function(callback){
    var self = this;
    self.api.elasticsearch.client.indices.delete({index: 'test-*'}, function(){
      elasticsearchMigrator(self.api, callback);
    });
  },

  flushIndices: function(callback){
    var self = this;
    var jobs = [];
    // TODO: This doesn't work on Travis.ci?
    if(process.env.TRAVIS){
      setTimeout(callback, 5001);
    }else{
      self.api.elasticsearch.client.indices.get({index: '*'}, function(error, indices){
        Object.keys(indices).forEach(function(index){
          if(index.indexOf('test-') === 0){
            jobs.push(function(done){
              self.api.elasticsearch.client.indices.flushSynced({index: index}, done);
            });
            // jobs.push(function(done){ setTimeout(done, 1); });
          }
        });

        async.series(jobs, callback);
      });
    }
  },

  login: function(jar, email, password, callback){
    var self = this;
    request.post({
      url: 'http://localhost:18080/api/session',
      jar: jar,
      form: { email: email, password: password }
    }, function(error, response){
      should.not.exist(error);
      var body = JSON.parse(response.body);
      body.success.should.equal(true);
      body.user.email.should.equal(email);
      callback(body.csrfToken);
    });
  },

  requestWithLogin: function(email, password, route, verb, params, callback){
    var self = this;
    var jar = request.jar();
    self.login(jar, email, password, function(csrfToken){
      params.csrfToken = csrfToken;
      if(verb === 'get'){
        route += '?';
        for(var key in params){ route += key + '=' + params[key] + '&'; }
      }
      request[verb]({
        url: route,
        jar: jar,
        form: params
      }, callback);
    });
  },
};

module.exports = specHelper;
