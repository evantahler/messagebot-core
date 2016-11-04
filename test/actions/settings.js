var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var email      = 'admin@localhost.com';
var password   = 'password';
var api;

describe('settings', function(){
  beforeEach(function(){ api = specHelper.api; });

  describe('settings:list', function(){
    it('falis (not logged in)', function(done){
      api.specHelper.runAction('settings:list', function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });

    it('succedes', function(done){
      specHelper.requestWithLogin(email, password, 'settings:list', {}, function(response){
        should.not.exist(response.error);
        Object.keys(response.team).length.should.be.above(0);
        Object.keys(response.settings).length.should.be.above(0);
        should.exist(response.settings['client:tracking:web:cookieName']);
        done();
      });
    });
  });

  describe('settings:edit', function(){
    it('falis (not logged in)', function(done){
      api.specHelper.runAction('setting:edit', function(response){
        response.error.should.equal('Error: Please log in to continue');
        done();
      });
    });

    it('succedes', function(done){
      specHelper.requestWithLogin(email, password, 'setting:edit', {
        key: 'client:tracking:web:cookieName',
        value: 'someCookie'
      }, function(response){
        should.not.exist(response.error);

        specHelper.requestWithLogin(email, password, 'settings:list', {}, function(response){
          should.not.exist(response.error);
          response.settings['client:tracking:web:cookieName'].value.should.equal('someCookie');
          done();
        });
      });
    });
  });

});
