// var should     = require('should');
// var request    = require('request');
// var async      = require('async');
// var dateformat = require('dateformat');
// var specHelper = require(__dirname + '/../specHelper');
// var route      = 'http://localhost:18080/api/message';
// var indexUrl;
// var aliasUrl;
//
// describe('models:message', function(){
//
//   /// HELPERS ///
//
//   var createAndSync = function(payload, callback){
//     payload.sync = true;
//     request.post(route, {form: payload}, function(error, data){
//       should.not.exist(error);
//       var body = JSON.parse(data.body);
//       specHelper.flushIndices(function(error){
//         if(error){
//           if(error.displayName === 'Conflict'){
//             setTimeout(createAndSync, 1000, payload, callback);
//           }else{
//             should.not.exit(error);
//           }
//         }else{
//           callback(null, body);
//         }
//       });
//     });
//   };
//
//   /// SETUP ///
//
//   before(function(done){ specHelper.startServer(done); });
//   before(function(done){ specHelper.rebuildElasticsearch(done); });
//   after(function(done){  specHelper.stopServer(done);  });
//
//   /// TESTS ///
//
//   it('should have the proper indexes created', function(done){
//     specHelper.api.elasticsearch.client.indices.get({index: '*'}, function(error, indices){
//       var names = Object.keys(indices);
//       var thisMonth = dateformat(new Date(), 'yyyy-mm');
//       names.indexOf('test-messages-' + thisMonth).should.be.above(-1);
//       indexUrl = specHelper.api.config.elasticsearch.urls[0] + '/test-messages-' + thisMonth;
//       aliasUrl = specHelper.api.config.elasticsearch.urls[0] + '/messages';
//
//       done();
//     });
//   });
//
//   describe('create', function(){
//     it('happy', function(done){
//       var payload = {
//         personGuid: 'abc123',
//         type: 'email',
//         body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//       };
//
//       request.post(route, {form: payload}, function(error, data){
//         should.not.exist(error);
//         var body = JSON.parse(data.body);
//         should.exist(body.guid);
//         done();
//       });
//     });
//
//     it('sad', function(done){
//       var payload = {
//         type: 'email',
//         body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//       };
//
//       request.post(route, {form: payload}, function(error, data){
//         should.not.exist(error);
//         var body = JSON.parse(data.body);
//         body.error.should.equal('personGuid is a required parameter for this action');
//         done();
//       });
//     });
//   });
//
//   describe('view', function(){
//     it('happy', function(done){
//       var payload = {
//         personGuid: 'abc123',
//         type: 'email',
//         body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//       };
//
//       createAndSync(payload, function(error, body){
//         should.not.exist(error);
//         request.get(route + '?guid=' + body.guid, function(error, data){
//           should.not.exist(error);
//           var body = JSON.parse(data.body);
//           should.not.exist(body.error);
//           body.message.personGuid.should.equal('abc123');
//           body.message.type.should.equal('email');
//           done();
//         });
//       });
//     });
//
//     it('sad', function(done){
//       var payload = {
//         personGuid: 'abc123',
//         type: 'email',
//         body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//       };
//
//       createAndSync(payload, function(error, body){
//         should.not.exist(error);
//         request.get(route + '?guid=' + body.guid + 'XXX', function(error, data){
//           should.not.exist(error);
//           var body = JSON.parse(data.body);
//           body.error.should.equal('not found');
//           done();
//         });
//       });
//     });
//   });
//
//   describe('edit', function(){
//     it('happy', function(done){
//       var payload = {
//         personGuid: 'abc123',
//         type: 'email',
//         body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//       };
//
//       createAndSync(payload, function(error, body){
//         should.not.exist(error);
//         var update = {
//           guid: body.guid,
//           readAt: new Date(1457909383608),
//           data: JSON.stringify({ readBy: 'gmail' })
//         };
//
//         request.put(route, {form: update}, function(error, data){
//           should.not.exist(error);
//           specHelper.flushIndices(function(error){
//             should.not.exist(error);
//             request.get(route + '?guid=' + body.guid, function(error, data){
//               should.not.exist(error);
//               var body = JSON.parse(data.body);
//               should.not.exist(body.error);
//               body.message.type.should.equal('email');
//               body.message.data.readBy.should.equal('gmail');
//
//               var sourceTime = (new Date(body.message.readAt)).getTime();
//               sourceTime.should.equal( new Date(1457909383608).getTime() );
//
//               done();
//             });
//           });
//         });
//       });
//     });
//   });
//
//   describe('delete', function(){
//     it('happy', function(done){
//       var payload = {
//         personGuid: 'abc123',
//         type: 'email',
//         body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//       };
//
//       createAndSync(payload, function(error, body){
//         should.not.exist(error);
//         request.del(route, {form: {guid: body.guid}}, function(error, data){
//           should.not.exist(error);
//           specHelper.flushIndices(function(error){
//             request.get(route + '?guid=' + body.guid, function(error, data){
//               should.not.exist(error);
//               var body = JSON.parse(data.body);
//               body.error.should.equal('not found');
//               done();
//             });
//           });
//         });
//       });
//     });
//   });
//
//   describe('search', function(){
//     it('happy', function(done){
//       var jobs = [];
//       jobs.push(function(next){
//         request.post(route, {form: {
//           personGuid: 'search_user_guid',
//           type: 'email',
//           body: '<h1>Sups.</h1><p>Welcome to the site!</p>',
//         }}, next);
//       });
//       jobs.push(function(next){
//         request.post(route, {form: {
//           personGuid: 'search_user_guid',
//           type: 'email',
//           body: '<h1>Where have you been?</h1><p>We miss you :(</p>',
//         }}, next);
//       });
//       jobs.push(function(next){
//         request.post(route, {form: {
//           personGuid: 'search_user_guid',
//           type: 'push',
//           body: 'a thing you love is on sale',
//         }}, next);
//       });
//
//       async.parallel(jobs, function(error){
//         should.not.exist(error);
//         specHelper.flushIndices(function(error){
//           should.not.exist(error);
//           request.get("http://localhost:18080/api/messages/search?searchKeys[]=personGuid&searchKeys[]=type&searchValues[]=search_user_guid&&searchValues[]=email", function(error, data){
//             should.not.exist(error);
//             var body = JSON.parse(data.body);
//             should.not.exist(body.error);
//             body.messages.length.should.equal(2);
//             done();
//           });
//         });
//       });
//     });
//   });
//
//   describe('aggregate', function(){
//     it('happy', function(done){
//       var jobs = [];
//       jobs.push(function(next){
//         request.post(route, {form: {
//           personGuid: 'agg_user_guid',
//           type: 'ios_push',
//           body: '...',
//         }}, next);
//       });
//       jobs.push(function(next){
//         request.post(route, {form: {
//           personGuid: 'agg_user_guid',
//           type: 'ios_push',
//           body: '...',
//         }}, next);
//       });
//       jobs.push(function(next){
//         request.post(route, {form: {
//           personGuid: 'agg_user_guid',
//           type: 'android_push',
//           body: '...',
//         }}, next);
//       });
//
//       async.parallel(jobs, function(error){
//         should.not.exist(error);
//         specHelper.flushIndices(function(error){
//           should.not.exist(error);
//           request.get("http://localhost:18080/api/messages/aggregation?searchKeys[]=personGuid&searchKeys[]=type&searchValues[]=agg_user_guid&&searchValues[]=ios_push", function(error, data){
//             should.not.exist(error);
//             var body = JSON.parse(data.body);
//             should.not.exist(body.error);
//             body.value.value.should.equal(2);
//             done();
//           });
//         });
//       });
//     });
//   });
//
// });
