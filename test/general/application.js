var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');

describe('general:applicaiton', function(){

  before(function(done){ specHelper.startServer(done); });
  after(function(done){  specHelper.stopServer(done);  });

  it('can boot', function(done){
    specHelper.api.running.should.equal(true);
    done();
  });

});
