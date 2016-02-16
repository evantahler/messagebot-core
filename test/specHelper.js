var actionheroPrototype = require('actionhero').actionheroPrototype;
var elasticsearchMigrator = require(__dirname + '/../db/elasticsearch/migrate.js').migrate
var async   = require('async');
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
    
    // self.api.elasticsearch.client.indices.get({index: '*'}, function(error, indices){
    //   Object.keys(indices).forEach(function(index){
    //     if(index.indexOf('test-') === 0){
    //       jobs.push(function(done){
    //         self.api.elasticsearch.client.indices.flushSynced({index: index}, done);
    //       });
    //     }
    //   });
    //
    //   async.series(jobs, callback);
    // });

    setTimeout(callback, 5001);
  },
};

module.exports = specHelper;
