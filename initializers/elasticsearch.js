var path              = require('path');
var fs                = require('fs');
var util              = require('util');
var async             = require('async');
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

      prepareQuery: function(searchKeys, searchValues, start, end, dateField){
        var musts = [];
        var q, key, val;

        for(var i in searchKeys){
          q = {};
          key = searchKeys[i];
          val = searchValues[i];

          if(typeof(val) === 'string'){
            val = val.toLowerCase();
          }

          if(val === '_exists'){
            q['field'] = key;
            musts.push({ exists: q });
          }else if(val === '_missing'){
            q['field'] = key;
            musts.push({ missing: q });
          }else if(typeof val === 'string' && val.indexOf('*') >=0){
            q[key] = val;
            musts.push({ wildcard: q });
          }else{
            q[key] = val;
            musts.push({ term: q });
          }
        }

        if(start && end && dateField){
          var range = {};
          range[dateField] = {gte: start.getTime(), lte: end.getTime()};
          musts.push({range: range});
        }

        return musts;
      },

      search: function(alias, searchKeys, searchValues, from, size, sort, callback){
        var results = [];

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
                  must: this.prepareQuery(searchKeys, searchValues)
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

      mget: function(alias, ids, callback){
        var indexes = []; // we meed to scan each index directly, not the alias
        var jobs = [];
        var results = [];

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.cat.aliases({
          name: alias
        }, function(error, data){
          api.elasticsearch.pendingOperations--;
          if(error){ return callback(error); }
          data = data.split('\n');
          data.forEach(function(d){
            var words = d.split(' ');
            if(words.length > 1){ indexes.push(words[1]); }
          });

          if(indexes.length === 0){ indexes = [alias]; }

          indexes.forEach(function(index){
            jobs.push(function(done){
              api.elasticsearch.pendingOperations++;
              api.elasticsearch.client.mget({
                  index: index,
                  body: {
                    ids: ids
                  }
              }, function(error, data){
                api.elasticsearch.pendingOperations--;
                if(error){ return done(error); }
                data.docs.forEach(function(doc){
                  if(doc.found === true){
                    results.push(doc._source);
                  }
                });
                done();
              });
            })
          });

          async.parallelLimit(jobs, 10, function(error){
            return callback(null, results);
          });
        });
      },

      scroll: function(alias, query, callback){
        var scroll = '30s';
        var fields = ['guid', 'personGuid'];
        var results = [];

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.search({
            index: alias,
            scroll: scroll,
            fields: fields,
            body: {
              query: query
            }
        }, function getMoreUntilDone(error, data){
          api.elasticsearch.pendingOperations--;
          if(error){ return callback(error); }

          data.hits.hits.forEach(function(hit){
            if(hit.fields.personGuid){
              results = results.concat(hit.fields.personGuid);
            }else if(hit.fields.guid){
              results = results.concat(hit.fields.guid);
            }
          });

          if(data.hits.total !== results.length && data.hits.hits.length > 0){
            client.scroll({
              scrollId: data._scroll_id,
              scroll: scroll
            }, getMoreUntilDone);
          }else{
            callback(null, results, data.hits.total);
          }
        });
      },

      distinct: function(alias, searchKeys, searchValues, start, end, dateField, field, callback){
        var aggs = {
          agg_results: {terms: {field: field}}
        };

        var query = {
          size: 0,
          index: alias,
          body: {
            aggs: aggs,
            size: 0,
            query: {
              bool: {
                must: this.prepareQuery(searchKeys, searchValues, start, end, dateField),
              }
            }
          }
        };

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.search(query, function(error, data){
          api.elasticsearch.pendingOperations--;
          if(error){ return callback(error); }
          callback(null, data.aggregations.agg_results);
        });
      },

      aggregation: function(alias, searchKeys, searchValues, start, end, dateField, agg, aggField, interval, callback){
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
          size: 0,
          index: alias,
          body: {
            aggs: aggs,
            size: 0,
            query: {
              bool: {
                must: this.prepareQuery(searchKeys, searchValues, start, end, dateField),
              }
            }
          }
        };

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.search(query, function(error, data){
          api.elasticsearch.pendingOperations--;
          if(error){ return callback(error); }
          callback(null, data.aggregations.agg_results);
        });
      },
    };

    ////////////////////////
    // elasticsearchModel //
    ////////////////////////

    var elasticsearchModel = function(type, guid, index, alias){
      this.type  = type;
      this.index = index;
      this.alias = alias;
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
        }else if(key !== '_index'){
          payload.data[key] = self.data[key];
        }
      }

      payload.updatedAt = new Date();

      return payload;
    };

    elasticsearchModel.prototype.ensureGuid = function(){
      var self = this;
      if(!self.data.guid){
        self.data.guid = api.elasticsearch.cleanGuid( uuid.v4() );
      }
      return self.data.guid;
    };

    elasticsearchModel.prototype.create = function(callback){
      var self = this;
      var searchKey;
      var searchValue;

      self.ensureGuid();
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

      var doCreate = function(){
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
      }

      // we need to ensure that none of the params this new instance has match an existing person
      // if they do, we need to turn this into a merge operation.
      // to match as loosely as possible, we'll only work with the first matching param
      api.config.messagebot.uniqueFields[self.type].forEach(function(k){
        if(payload[k] && !searchKey){ searchKey = k; searchValue = payload[k]; }
        if(payload.data[k] && !searchKey){ searchKey = ('data.' + k); searchValue = payload.data[k]; }
      });

      if(!searchKey){ doCreate(); }
      else{
        api.elasticsearch.search(self.alias, [searchKey], [searchValue], 0, 1, null, function(error, results){
          if(error){ return callback(error); }
          if(results.length === 0){ doCreate(); }
          else{
            self.data.guid = results[0].guid;
            self.edit(callback);
          }
        });
      }
    };

    elasticsearchModel.prototype.edit = function(callback){
      var self = this;
      var jobs = [];
      if(!self.data.guid){ return callback(new Error('guid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      jobs.push(function(done){
        var payload;
        try{
          payload = self.prepareData();
        }catch(e){ return callback(e); }

        self.hydrate(function(error){
          if(error){ return done(error); }

          Object.keys(payload).forEach(function(k){
            if(self.requiredFields.indexOf(k) >= 0 && k !== 'data'){
              self.data[k] = payload[k];
            }
          });

          Object.keys(payload.data).forEach(function(k){
            if(payload.data[k] !== '_delete'){
              self.data.data[k] = payload.data[k];
            }else{
              delete self.data.data[k];
            }
          });

          done();
        });
      });

      jobs.push(function(done){
        var payload;
        try{
          payload = self.prepareData();
        }catch(e){ return callback(e); }

        api.elasticsearch.pendingOperations++;
        api.elasticsearch.client.index({
          index: self.data._index,
          type: self.type,
          id: self.data.guid,
          body: payload
        }, function(error){
          api.elasticsearch.pendingOperations--;
          done(error);
        });
      });

      async.series(jobs, function(error){
        if(error){ return callback(error); }
        return callback(null, self.data);
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
        alias: self.alias,
        type: self.type,
        body: {
          query: { ids: { values: [self.data.guid] } }
        }
      }, function(error, data){
        api.elasticsearch.pendingOperations--;
        if(error){ return callback(error); }
        if(data.hits.hits.length === 0){ return callback(new Error(self.type + ' (' + self.data.guid + ') not found')); }
        self.data = data.hits.hits[0]._source;

        if(self.data.createdAt){ self.data.createdAt = new Date(self.data.createdAt); }
        if(self.data.updatedAt){ self.data.updatedAt = new Date(self.data.updatedAt); }

        //TODO: date-ify all hash data in the response.  We can do a regexp match?

        self.data._index = data.hits.hits[0]._index;
        callback(null, self.data);
      });
    };

    elasticsearchModel.prototype.delete = function(callback){
      var self = this;
      if(!self.data.guid){ return callback(new Error('guid is required')); }
      if(!self.index){     return callback(new Error('index is required')); }

      api.elasticsearch.pendingOperations++;
      api.elasticsearch.client.delete({
        index: self.data._index,
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

      var thisModel = function(guid, index, alias){
        if(!index){ index = api.env + '-' + name + '-' + dateformat(new Date(), 'yyyy-mm'); }
        if(!alias){ alias = api.env + '-' + name; }
        elasticsearchModel.call(this, modelName, guid, index, alias);
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
