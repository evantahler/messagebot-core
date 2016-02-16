var actionheroPrototype = require('actionhero').actionheroPrototype;

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
    self.api.elasticsearch.client.indices.flushSynced({index: '*'}, callback);
  },
};

module.exports = specHelper;
