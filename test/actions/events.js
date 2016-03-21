var should     = require('should');
var request    = require('request');
var async      = require('async');
var dateformat = require('dateformat');
var specHelper = require(__dirname + '/../specHelper');
var route      = 'http://localhost:18080/api/event';
var indexUrl;
var aliasUrl;

describe('models:events', function(){

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
      names.indexOf('test-events-' + thisMonth).should.be.above(-1);
      indexUrl = specHelper.api.config.elasticsearch.urls[0] + '/test-events-' + thisMonth;
      aliasUrl = specHelper.api.config.elasticsearch.urls[0] + '/events';

      done();
    });
  });

  describe('create', function(){
    it('happy', function(done){
      var payload = {
        userGuid: 'user_abc123',
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
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
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
      };

      request.post(route, {form: payload}, function(error, data){
        should.not.exist(error);
        var body = JSON.parse(data.body);
        body.error.should.equal('userGuid is a required parameter for this action');
        done();
      });
    });

    it('will populate lat/lon from IP if not present', function(done){
      var payload = {
        userGuid: 'user_abc123',
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
        ip: '8.8.8.8'
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        request.get(route + '?guid=' + body.guid, function(error, data){
          should.not.exist(error);
          var body = JSON.parse(data.body);
          should.not.exist(body.error);
          body.event.location.lat.should.equal(37.3845);
          body.event.location.lon.should.equal(-122.0881);
          done();
        });
      });
    });
  });

  describe('view', function(){
    it('happy', function(done){
      var payload = {
        userGuid: 'user_abc123',
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        request.get(route + '?guid=' + body.guid, function(error, data){
          should.not.exist(error);
          var body = JSON.parse(data.body);
          should.not.exist(body.error);
          body.event.data.page.should.equal('/');
          body.event.userGuid.should.equal('user_abc123');
          body.event.type.should.equal('pageview');
          done();
        });
      });
    });

    it('sad', function(done){
      var payload = {
        userGuid: 'user_abc123',
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
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
        userGuid: 'user_abc123',
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
      };

      createAndSync(payload, function(error, body){
        should.not.exist(error);
        var update = {
          guid: body.guid,
          data: JSON.stringify({ page: '/other-page' })
        };

        request.put(route, {form: update}, function(error, data){
          should.not.exist(error);
          specHelper.flushIndices(function(error){
            should.not.exist(error);
            request.get(route + '?guid=' + body.guid, function(error, data){
              should.not.exist(error);
              var body = JSON.parse(data.body);
              should.not.exist(body.error);
              body.event.data.page.should.equal('/other-page');
              body.event.userGuid.should.equal('user_abc123');
              body.event.type.should.equal('pageview');
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
        userGuid: 'user_abc123',
        type: 'pageview',
        data: JSON.stringify({page: '/'}),
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
          userGuid: 'user_for_search',
          type: 'pageview',
          data: JSON.stringify({page: '/'}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          userGuid: 'user_for_search',
          type: 'pageview',
          data: JSON.stringify({page: '/other-page'}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          userGuid: 'user_for_search',
          type: 'pageview',
          data: JSON.stringify({page: '/about'}),
        }}, next);
      });

      async.parallel(jobs, function(error){
        should.not.exist(error);
        specHelper.flushIndices(function(error){
          should.not.exist(error);
          request.get(route + 's/search?searchKeys=userGuid&searchValues=user_for_search', function(error, data){
            should.not.exist(error);
            var body = JSON.parse(data.body);
            should.not.exist(body.error);
            body.events.length.should.equal(3);
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
          userGuid: 'user_for_agg',
          type: 'pageview',
          data: JSON.stringify({page: '/'}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          userGuid: 'user_for_agg',
          type: 'pageview',
          data: JSON.stringify({page: '/other-page'}),
        }}, next);
      });
      jobs.push(function(next){
        request.post(route, {form: {
          userGuid: 'user_for_agg',
          type: 'pageview',
          data: JSON.stringify({page: '/about'}),
        }}, next);
      });

      async.parallel(jobs, function(error){
        should.not.exist(error);
        specHelper.flushIndices(function(error){
          should.not.exist(error);
          request.get(route + 's/aggregation?searchKeys=userGuid&searchValues=user_for_agg', function(error, data){
            should.not.exist(error);
            var body = JSON.parse(data.body);
            should.not.exist(body.error);
            body.value.value.should.equal(3);
            done();
          });
        });
      });
    });
  });

});
