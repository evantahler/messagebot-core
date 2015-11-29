var path              = require('path');
var fs                = require('fs');
var elasticsearch     = require('elasticsearch');

module.exports = {
  loadPriority:  100,
  startPriority: 100,

  initialize: function(api, next){
    
    var client = new elasticsearch.Client({
      hosts: api.config.elasticsearch.urls,
      log: api.config.elasticsearch.log,
    });

    api.elasticsearch = {
      client: client
    };

    next();
  },

  start: function(api, next){
    api.elasticsearch.client.ping({}, function(error){
      if(error){
        api.log('Cannot connect to ElasticSearch: ', 'crit');
        api.log(error, 'crit');
        next(error);
      }else{
        api.log('connected to ElasticSearch');
        next();
      }
    });
  }
};