var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var api;
var template;

describe('models:templates', function(){
  beforeEach(function(){ api = specHelper.api; });

  afterEach(function(done){
    if(template.isNewRecord === false){
      template.destroy().then(function(){ done(); });
    }else{
      done();
    }
  });

  it('can create new template with valid params', function(done){
    template = api.models.template.build({
      teamId:      1,
      name:        'my template',
      description: 'my template',
      type:        'simple',
      folder:      'default'
    });

    template.save().then(function(){
      api.models.template.findOne({where: {name: 'my template'}}).then(function(template){
        template.folder.should.equal('default');
        done();
      });
    });
  });

  it('will not create new template with invalid params (missing requirement)', function(done){
    template = api.models.template.build({
      teamId:      1,
      type:        'simple',
      folder:      'default'
    });

    template.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(2);
      errors.errors[0].message.should.equal('name cannot be null');
      errors.errors[1].message.should.equal('description cannot be null');
      done();
    });
  });

  it('will not create new templates with invalid params (duplicate key)', function(done){
    template = api.models.template.build({
      teamId:      1,
      name:        'my template',
      description: 'my template',
      type:        'simple',
      folder:      'default'
    });

    template.save().then(function(){
      var otherTemplate = api.models.template.build({
        teamId:      1,
        name:        'my template',
        description: 'my template',
        type:        'simple',
        folder:      'default'
      });

      otherTemplate.save().then(function(){
        throw new Error('should not get here');
      }).catch(function(errors){
        errors.errors.length.should.equal(1);
        errors.errors[0].message.should.equal('templates_team_id_name must be unique');
        done();
      });
    });
  });

});
