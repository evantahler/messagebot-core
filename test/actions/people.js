var should     = require('should');
var request    = require('request');
var async      = require('async');
var dateformat = require('dateformat');
var specHelper = require(__dirname + '/../specHelper');
var route      = 'http://localhost:18080/api/person';
var indexUrl;
var aliasUrl;

describe('models:person', function(){

  /// HELPERS ///

  var createAndSync = function(payload, callback){
    payload.sync = true;
    request.post(route, {form: payload}, function(error, data){
      should.not.exist(error);
      var body = JSON.parse(data.body);
      specHelper.flushIndices(function(error){
        if(error){
          if(error.displayName === 'Conflict'){
            setTimeout(createAndSync, 1000, payload, callback);
          }else{
            should.not.exit(error);
          }
        }else{
          callback(null, body);
        }
      });
    });
  };

  /// SETUP ///

  before(function(done){ specHelper.startServer(done); });
  before(function(done){ specHelper.rebuildElasticsearch(done); });
  after(function(done){  specHelper.stopServer(done);  });

  /// TESTS ///

  it('should have the proper indexes created', function(done){
    specHelper.api.elasticsearch.client.indices.get({index: '*'}, function(error, indices){
      var names = Object.keys(indices);
      var thisMonth = dateformat(new Date(), 'yyyy-mm');
      names.indexOf('test-people-' + thisMonth).should.be.above(-1);
      indexUrl = specHelper.api.config.elasticsearch.urls[0] + '/test-people-' + thisMonth;
      aliasUrl = specHelper.api.config.elasticsearch.urls[0] + '/people';

      done();
    });
  });

  describe('create', function(){
    it('happy', function(done){
      var payload = {
        data: JSON.stringify({acquisitionSource: 'web'})
      };

      request.post(route, {form: payload}, function(error, data){
        should.not.exist(error);
        var body = JSON.parse(data.body);
        should.exist(body.guid);
        done();
      });
    });

    it('sad', function(done){
      var payload = {
        guid: 'user_abc123'
      };

      request.post(route, {form: payload}, function(error, data){
        should.not.exist(error);
        var body = JSON.parse(data.body);
        body.error.should.equal('data is a required parameter for this action');
        done();
      });
    });
  });

  describe('view', function(){
    it('happy', function(done){
      var payload = {
        data: JSON.stringify({acquisitionSource: 'web'})
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        request.get(route + '?guid=' + body.guid, function(error, data){
          should.not.exist(error);
          var body = JSON.parse(data.body);
          should.not.exist(body.error);
          body.person.data.acquisitionSource.should.equal('web');
          done();
        });
      });
    });

    it('sad', function(done){
      var payload = {
        data: JSON.stringify({acquisitionSource: 'web'})
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        request.get(route + '?guid=' + body.guid + 'XXX', function(error, data){
          should.not.exist(error);
          var body = JSON.parse(data.body);
          body.error.should.equal('not found');
          done();
        });
      });
    });
  });

  describe('edit', function(){
    it('happy', function(done){
      var payload = {
        data: JSON.stringify({acquisitionSource: 'web'})
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        var update = {
          guid: body.guid,
          data: JSON.stringify({ clv: 123 })
        };

        request.put(route, {form: update}, function(error, data){
          should.not.exist(error);
          specHelper.flushIndices(function(error){
            should.not.exist(error);
            request.get(route + '?guid=' + body.guid, function(error, data){
              should.not.exist(error);
              var body = JSON.parse(data.body);
              should.not.exist(body.error);
              body.person.data.acquisitionSource.should.equal('web');
              body.person.data.clv.should.equal(123);
              done();
            });
          });
        });
      });
    });
  });

  describe('delete', function(){
    it('happy', function(done){
      var payload = {
        data: JSON.stringify({acquisitionSource: 'web'})
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        request.del(route, {form: {guid: body.guid}}, function(error, data){
          should.not.exist(error);
          specHelper.flushIndices(function(error){
            request.get(route + '?guid=' + body.guid, function(error, data){
              should.not.exist(error);
              var body = JSON.parse(data.body);
              body.error.should.equal('not found');
              done();
            });
          });
        });
      });
    });
  });

  describe('search', function(){
    it('happy', function(done){
      var jobs = [];
      jobs.push(function(next){
        request.post(route, {form: {
          data: JSON.stringify({acquisitionSource: 'desktop'}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          data: JSON.stringify({acquisitionSource: 'desktop'}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          data: JSON.stringify({acquisitionSource: 'mobile'}),
        }}, next);
      });

      async.parallel(jobs, function(error){
        should.not.exist(error);
        specHelper.flushIndices(function(error){
          should.not.exist(error);
          request.get('http://localhost:18080/api/people/search?searchKeys=data.acquisitionSource&searchValues=desktop', function(error, data){
            should.not.exist(error);
            var body = JSON.parse(data.body);
            should.not.exist(body.error);
            body.people.length.should.equal(2);
            done();
          });
        });
      });
    });
  });

  describe('aggregate', function(){
    it('happy', function(done){
      var jobs = [];
      jobs.push(function(next){
        request.post(route, {form: {
          data: JSON.stringify({clv: 100}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          data: JSON.stringify({clv: 200}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          data: JSON.stringify({clv: 100}),
        }}, next);
      });

      async.parallel(jobs, function(error){
        should.not.exist(error);
        specHelper.flushIndices(function(error){
          should.not.exist(error);
          request.get('http://localhost:18080/api/people/aggregation?searchKeys=data.clv&searchValues=100', function(error, data){
            should.not.exist(error);
            var body = JSON.parse(data.body);
            should.not.exist(body.error);
            body.value.value.should.equal(2);
            done();
          });
        });
      });
    });
  });

});
