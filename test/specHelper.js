var actionheroPrototype = require('actionhero').actionheroPrototype;
var async = require('async');

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

  flushIndices: function(callback){
    var self = this;
    var jobs = [];
    self.api.elasticsearch.client.indices.get({index: '*'}, function(error, indices){
      Object.keys(indices).forEach(function(index){
        if(index.indexOf('test-') === 0){
          jobs.push(function(done){
            self.api.elasticsearch.client.indices.flushSynced({index: index}, done);
          });
        }
      });

      async.series(jobs, callback);
    });
  },
};

module.exports = specHelper;
