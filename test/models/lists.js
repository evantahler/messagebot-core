var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;
var list;

describe('models:lists', function(){

  before(function(done){
    specHelper.start(function(error, a){
      api = a; done(error);
    });
  });

  after(function(done){ specHelper.stop(done); });

  afterEach(function(done){
    if(list.isNewRecord === false){
      list.destroy().then(function(){ done(); });
    }else{
      done();
    }
  });

  it('can create new list with valid params', function(done){
    list = api.models.list.build({
      teamId:      1,
      name:        'my list',
      type:        'simple',
      folder:      'default'
    });

    list.save().then(function(){
      api.models.list.findOne({where: {name: 'my list'}}).then(function(list){
        list.folder.should.equal('default');
        done();
      });
    });
  });

  it('will not create new list with invalid params (missing requirement)', function(done){
    list = api.models.list.build({
      teamId:      1,
      folder:      'default'
    });

    list.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(2);
      errors.errors[0].message.should.equal('name cannot be null');
      errors.errors[1].message.should.equal('type cannot be null');
      done();
    });
  });

  it('will not create new lists with invalid params (duplicate key)', function(done){
    list = api.models.list.build({
      teamId:      1,
      name:        'my list',
      type:        'simple',
      folder:      'default'
    });


    list.save().then(function(){
      var otherList = api.models.list.build({
        teamId:      1,
        name:        'my list',
        type:        'simple',
        folder:      'default'
      });


      otherList.save().then(function(){
        throw new Error('should not get here');
      }).catch(function(errors){
        errors.errors.length.should.equal(1);
        errors.errors[0].message.should.equal('lists_team_id_name must be unique');
        done();
      });
    });
  });

  it('will not create new lists with invalid params (bad type)', function(done){
    list = api.models.list.build({
      teamId:      1,
      name:        'my list',
      type:        'wacky',
      folder:      'default'
    });

    list.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(1);
      errors.errors[0].message.should.equal('type is invalid');
      done();
    });
  });

});
