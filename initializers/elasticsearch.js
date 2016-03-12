var path              = require('path');
var fs                = require('fs');
var util              = require('util');
var uuid              = require('node-uuid');
var dateformat        = require('dateformat');
var elasticsearch     = require('elasticsearch');

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
      pendingOperations: 0,

      cleanGuid: function(guid){
        //elasticsearch hates '-'
        if(!guid){ return null; }

        guid = guid.replace(/-/g, '');
        guid = guid.replace(/\s/g, '');
        return guid;
      },

      search: function(alias, searchKeys, searchValues, from, size, sort, callback){
        var musts = [];
        var results = [];

        for(var i in searchKeys){
          var q = {};
          q[searchKeys[i]] = searchValues[i];
          musts.push({ wildcard: q });
        }

        if(!sort){
          sort = [
            { "createdAt" : "desc"}
          ];
        }

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.search({
            index: alias,
            from: from,
            size: size,
            body: {
              sort: sort,
              query: {
                bool: {
                  must: musts
                }
              }
            }
        }, function(error, data){
          api.elasticsearch.pendingOperations--;
          if(error){ return callback(error); }
          data.hits.hits.forEach(function(hit){
            results.push(hit._source);
          });
          callback(null, results, data.hits.total);
        });
      },

      aggregation: function(alias, searchKeys, searchValues, start, end, dateField, agg, aggField, interval, callback){
        var musts = [];

        for(var i in searchKeys){
          var q = {};
          q[searchKeys[i]] = searchValues[i];
          musts.push({ wildcard: q });
        }

        var range = {};
        range[dateField] = {gte: start, lte: end};

        var aggs = {agg_results: {}};
        if(interval){
          var format = 'yyyy-MM-dd';
          if(interval === 'year'){ format = 'yyyy'; }
          if(interval === 'month'){ format = 'yyyy-MM'; }
          if(interval === 'week'){ format = 'yyyy-MM-dd'; }
          if(interval === 'day'){ format = 'yyyy-MM-dd'; }
          if(interval === 'hour'){ format = 'yyyy-MM-dd HH:00'; }
          if(interval === 'minute'){ format = 'yyyy-MM-dd HH:mm'; }

          aggs.agg_results[agg] = {
            field: aggField,
            interval: interval,
            format: format,
          };
        }else{
          aggs.agg_results[agg] = { field: aggField };
        }

        var query = {
          // size: 0,
          index: alias,
          body: {
            aggs: aggs,
            filter:{ range: range },
            query: {
              bool: {
                must: musts
              }
            }
          }
        };

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.search(query, function(error, data){
          api.elasticsearch.pendingOperations--;
          callback(null, data.aggregations.agg_results);
        });
      },
    };

    ////////////////////////
    // elasticsearchModel //
    ////////////////////////

    var elasticsearchModel = function(type, index, guid){
      this.type  = type;
      this.index = index || null;
      this.data  = {
        guid: api.elasticsearch.cleanGuid(guid) || null
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
      if(!self.data.guid){ self.data.guid = api.elasticsearch.cleanGuid( uuid.v4() ); }
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

      api.elasticsearch.pendingOperations++;
      api.elasticsearch.client.create({
        index: self.index,
        type: self.type,
        id: self.data.guid,
        body: payload
      }, function(error, data){
        api.elasticsearch.pendingOperations--;
        callback(error, data);
      });
    };

    elasticsearchModel.prototype.edit = function(callback){
      var self = this;
      if(!self.data.guid){ return callback(new Error('guid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      var payload;
      try{
        payload = self.prepareData();
      }catch(e){ return callback(e); }

      api.elasticsearch.pendingOperations++;
      api.elasticsearch.client.update({
        index: self.index,
        type: self.type,
        id: self.data.guid,
        body: {doc: payload}
      }, function(error, data){
        api.elasticsearch.pendingOperations--;
        if(error){ return callback(error); }
        self.data = data;
        callback(null, data);
      });
    };

    elasticsearchModel.prototype.hydrate = function(callback){
      var self = this;
      if(!self.data.guid){ return callback(new Error('guid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      // TODO: Can we use the GET api rather than a search?
      // You cannot GET over an alias...
      api.elasticsearch.pendingOperations++;
      api.elasticsearch.client.search({
        alias: self.index,
        type: self.type,
        body: {
          query: { ids: { values: [self.data.guid] } }
        }
      }, function(error, data){
        api.elasticsearch.pendingOperations--;
        if(error){ return callback(error); }
        if(data.hits.hits.length === 0){ return callback(new Error('not found')); }
        self.data = data.hits.hits[0]._source;
        callback(null, self.data);
      });
    };

    elasticsearchModel.prototype.delete = function(callback){
      var self = this;
      if(!self.data.guid){ return callback(new Error('guid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      api.elasticsearch.pendingOperations++;
      api.elasticsearch.client.delete({
        index: self.index,
        type: self.type,
        id: self.data.guid,
      }, function(error){
        api.elasticsearch.pendingOperations--;
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

      var thisModel = function(index, guid){
        if(!index){ index = api.env + '-' + name + '-' + dateformat(new Date(), 'yyyy-mm'); }
        elasticsearchModel.call(this, modelName, index, guid);
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
    api.elasticsearch.client.close();
    next();
  }
};
