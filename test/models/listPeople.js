var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;
var listPerson;

describe('models:listPeople', function(){

  before(function(done){
    specHelper.start(function(error, a){
      api = a; done(error);
    });
  });

  after(function(done){ specHelper.stop(done); });

  afterEach(function(done){
    if(listPerson.isNewRecord === false){
      listPerson.destroy().then(function(){ done(); });
    }else{
      done();
    }
  });

  it('can create a new listPerson with valid params', function(done){
    listPerson = api.models.listPerson.build({
      teamId: 1,
      listId: 1,
      personGuid: 'abc123',
    });

    listPerson.save().then(function(){
      api.models.listPerson.findOne({where: {personGuid: 'abc123'}}).then(function(listPerson){
        listPerson.teamId.should.equal(1);
        done();
      });
    });
  });

  it('will not create a new listPerson with invalid params (missing requirement)', function(done){
    listPerson = api.models.listPerson.build({
      teamId: 1,
    });

    listPerson.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(2);
      errors.errors[0].message.should.equal('listId cannot be null');
      errors.errors[1].message.should.equal('personGuid cannot be null');
      done();
    });
  });

  it('will not create a new listPerson with invalid params (duplicate key)', function(done){
    listPerson = api.models.listPerson.build({
      teamId: 1,
      listId: 1,
      personGuid: 'abc123',
    });

    listPerson.save().then(function(){
      var otherlistPerson = api.models.listPerson.build({
        teamId: 1,
        listId: 1,
        personGuid: 'abc123',
      });


      otherlistPerson.save().then(function(){
        throw new Error('should not get here');
      }).catch(function(errors){
        errors.errors.length.should.equal(1);
        errors.errors[0].message.should.equal('list_people_list_id_person_guid must be unique');
        done();
      });
    });
  });

});
