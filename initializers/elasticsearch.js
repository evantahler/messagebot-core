var path              = require('path');
var fs                = require('fs');
var util              = require('util');
var uuid              = require('node-uuid');
var dateformat        = require('dateformat');
var elasticsearch     = require('elasticsearch');
var request           = require('request');

module.exports = {
  loadPriority:  100,
  startPriority: 100,

  initialize: function(api, next){
    api.models = api.models || {};
    
    var client = new elasticsearch.Client({
      hosts: api.config.elasticsearch.urls,
      log: api.config.elasticsearch.log,
    });

    api.elasticsearch = {
      client: client,
      indexes: [],

      search: function(alias, searchKeys, searchValues, callback){
        var terms = {};
        var results = [];

        for(var i in searchKeys){
          terms[ searchKeys[i] ] = searchValues[i];
        }

        api.elasticsearch.client.search({
            index: alias,
            body: {
              query: { 
                wildcard: terms 
              }
            }
        }, function(error, data){
          if(error){ return callback(error); }
          data.hits.hits.forEach(function(hit){
            results.push(hit._source);
          });
          callback(null, results);
        });
      },
    };

    ////////////////////////
    // elasticsearchModel //
    ////////////////////////

    var elasticsearchModel = function(type, index, uuid){
      this.type  = type; 
      this.index = index || null;
      this.data  = {
        uuid: uuid || null
      };
      this.requiredFields = [];
    };

    elasticsearchModel.prototype.prepareData = function(){
      var self = this;
      var payload = { data: {} };

      for(var key in self.data){
        if(self.requiredFields.indexOf(key) >= 0 && (self.data[key] === null || self.data[key] === undefined)){
          throw new Error(key + ' is required');
        }else if(self.requiredFields.indexOf(key) >= 0){
          payload[key] = self.data[key];
        }else{
          payload.data[key] = self.data[key];
        }
      }

      payload.updatedAt = new Date();

      return payload;
    };

    elasticsearchModel.prototype.create = function(callback){
      var self = this;
      if(!self.data.uuid){ self.data.uuid = uuid.v4(); }
      if(!self.index){ return callback(new Error('index is required')); }

      var payload;
      try{
        payload = self.prepareData();
      }catch(e){ return callback(e); }

      if(self.data.createdAt){
        payload.createdAt = self.data.createdAt;
      }else{
        payload.createdAt = payload.updatedAt;
      }

      api.elasticsearch.client.create({
        index: self.index,
        type: self.type,
        id: self.data.uuid,
        body: payload
      }, callback);
    };

    elasticsearchModel.prototype.edit = function(callback){
      var self = this;
      if(!self.data.uuid){ return callback(new Error('uuid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      var payload;
      try{
        payload = self.prepareData();
      }catch(e){ return callback(e); }

      api.elasticsearch.client.update({
        index: self.index,
        type: self.type,
        id: self.data.uuid,
        body: {doc: payload}
      }, function(error, data){
        if(error){ return callback(error); }
        self.data = data;
        callback(null, data);
      });
    };

    elasticsearchModel.prototype.hydrate = function(callback){
      var self = this;
      if(!self.data.uuid){ return callback(new Error('uuid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      // TODO: Can we use the GET api rather than a search?
      // You cannot GET over an alias... 
      api.elasticsearch.client.search({
        alias: self.index,
        type: self.type,
        body: {
          query: { ids: { values: [self.data.uuid] } }
        }
      }, function(error, data){
        if(error){ return callback(error); }
        if(data.hits.hits.length === 0){ return callback(new Error('not found')); }
        self.data = data.hits.hits[0]._source;
        callback(null, self.data);
      });
    };

    elasticsearchModel.prototype.destroy = function(callback){
      var self = this;
      if(!self.data.uuid){ return callback(new Error('uuid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      api.elasticsearch.client.delete({
        index: self.index,
        type: self.type,
        id: self.data.uuid,
      }, function(error){
        callback(error);
      });
    };

    ///////////////////////
    // INDEXES -> MODELS //
    ///////////////////////

    var dir = path.normalize(api.projectRoot + '/db/elasticsearch/indexes');
    fs.readdirSync(dir).forEach(function(file){
      var nameParts = file.split("/");
      var name = nameParts[(nameParts.length - 1)].split(".")[0];
      var data = require(dir + '/' + file);
      api.elasticsearch.indexes[api.env + '-' + name] = data;
      var modelName = Object.keys(data.mappings)[0];
      var requiredFields = Object.keys(data.mappings[modelName].properties);

      var thisModel = function(index, uuid){
        if(!index){ index = api.env + '-' + name + '-' + dateformat(new Date(), 'yyyy-mm'); }
        elasticsearchModel.call(this, modelName, index, uuid);
        this.requiredFields = requiredFields;
      };

      util.inherits(thisModel, elasticsearchModel);

      api.models[modelName] = thisModel;
    });

    next();
  },

  start: function(api, next){
    api.elasticsearch.client.ping({}, function(error){
      if(error){
        api.log('Cannot connect to elasticsearch: ', 'crit');
        api.log(error, 'crit');
        next(error);
      }else{
        api.log('connected to elasticsearch');
        next();
      }
    });
  },

  stop: function(api, next){
    // TODO: disconnect ES client or remove stream listener
    // api.elasticsearch.client.exit(next);

    next();
  }
};