// var should     = require('should');
// var request    = require('request');
// var specHelper = require(__dirname + '/../specHelper');
// var route      = 'http://localhost:18080/api/user';
// var otherUserId;
//
// describe('actions:users', function(){
//
//   before(function(done){ specHelper.startServer(done); });
//   after(function(done){ specHelper.api.models.user.truncate().then(done); });
//   after(function(done){ specHelper.stopServer(done);  });
//
//   it('users can see thier info', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', route, 'get', {}, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       body.user.email.should.equal('admin@localhost.com');
//       done();
//     });
//   });
//
//   it('users see lists of all the users', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', 'http://localhost:18080/api/users', 'get', {}, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       body.users.length.should.be.above(0);
//       body.users.forEach(function(user){
//         should.exist(user.email);
//       });
//       done();
//     });
//   });
//
//   it('admin users can create another user (happy)(1)', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', route, 'post', {
//       email: 'other-user@gmail.com',
//       password: 'pass',
//       firstName: 'f',
//       lastName: 'l',
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       otherUserId = body.user.id;
//       done();
//     });
//   });
//
//   it('admin users can create another user (happy)(2)', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', route, 'post', {
//       email: 'other-guy2@gmail.com',
//       password: 'pass',
//       firstName: 'f',
//       lastName: 'l',
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       done();
//     });
//   });
//
//   it('admin users can create another user (sad)', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', route, 'post', {
//       email: 'other-user@gmail.com',
//       firstName: 'f',
//       lastName: 'l',
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('password is a required parameter for this action');
//       done();
//     });
//   });
//
//   it('non-admin users canot create a user', function(done){
//     specHelper.requestWithLogin('other-user@gmail.com', 'pass', route, 'post', {
//       email: 'event-another-usre@gmail.com',
//       password: 'pass',
//       firstName: 'f',
//       lastName: 'l',
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('admin status requried');
//       done();
//     });
//   });
//
//   it('all users can edit thier settings', function(done){
//     specHelper.requestWithLogin('other-user@gmail.com', 'pass', route, 'put', {
//       firstName: 'myRealFirstName'
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       body.user.firstName.should.equal('myRealFirstName');
//       done();
//     });
//   });
//
//   it('admin users can edit another user', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', route, 'put', {
//       firstName: 'fullFirstName',
//       userId: otherUserId
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       body.user.firstName.should.equal('fullFirstName');
//       done();
//     });
//   });
//
//   it('non-admin users cannot edit thier state', function(done){
//     specHelper.requestWithLogin('other-user@gmail.com', 'pass', route, 'put', {
//       status: 'admin'
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('only admin role can modify status');
//       done();
//     });
//   });
//
//   it('non-admin users cannot edit a user', function(done){
//     specHelper.requestWithLogin('other-guy2@gmail.com', 'pass', route, 'put', {
//       firstName: 'anotherFirstName',
//       userId: otherUserId
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('only admin role can modify other users');
//       done();
//     });
//   });
//
//   it('non-admin users cannot delete another user', function(done){
//     specHelper.requestWithLogin('other-guy2@gmail.com', 'pass', route, 'put', {
//       firstName: 'anotherFirstName',
//       userId: otherUserId
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('only admin role can modify other users');
//       done();
//     });
//   });
//
//   it('admin users can delete another user', function(done){
//     specHelper.requestWithLogin('other-guy2@gmail.com', 'pass', route, 'del', {
//       userId: otherUserId
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('admin status requried');
//       done();
//     });
//   });
//
//   it('admin users cannot delete themselves', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', route, 'del', {
//       userId: 1
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       body.error.should.equal('you cannot delete yourself');
//       done();
//     });
//   });
//
//   it('can get a list of acceptable statuses', function(done){
//     specHelper.requestWithLogin('admin@localhost.com', 'password', 'http://localhost:18080/api/user/statuses', 'get', {
//       userId: 1
//     }, function(error, response){
//       should.not.exist(error);
//       var body = JSON.parse(response.body);
//       should.not.exist(body.error);
//       body.validStatuses.should.deepEqual([
//         'new',
//         'disabled',
//         'admin',
//         'marketer',
//         'analyst',
//         'developer',
//         'designer'
//       ]);
//       done();
//     });
//   });
//
// });
