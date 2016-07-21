var should     = require('should');
var specHelper = require(__dirname + '/../specHelper');
var campaign;
var api;

describe('models:campaigns', function(){
  beforeEach(function(){ api = specHelper.api; });

  afterEach(function(done){
    if(campaign.isNewRecord === false){
      campaign.destroy().then(function(){ done(); });
    }else{
      done();
    }
  });

  it('can create new campaign with valid params', function(done){
    campaign = api.models.campaign.build({
      teamId:      1,
      name:        'my campaign',
      description: 'my campaign',
      type:        'simple',
      folder:      'default',
      transport:   'smtp',
      listId:      1,
      templateId:  1,
    });

    campaign.save().then(function(){
      api.models.campaign.findOne({where: {name: 'my campaign'}}).then(function(campaign){
        campaign.folder.should.equal('default');
        done();
      });
    });
  });

  it('will not create new campaign with invalid params (missing requirement)', function(done){
    campaign = api.models.campaign.build({
      teamId:      1,
      type:        'simple',
      folder:      'default',
      transport:   'smtp',
      listId:      1,
      templateId:  1,
    });

    campaign.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(2);
      errors.errors[0].message.should.equal('name cannot be null');
      errors.errors[1].message.should.equal('description cannot be null');
      done();
    });
  });

  it('will not create new campaigns with invalid params (duplicate key)', function(done){
    campaign = api.models.campaign.build({
      teamId:      1,
      name:        'my campaign',
      description: 'my campaign',
      type:        'simple',
      folder:      'default',
      transport:   'smtp',
      listId:      1,
      templateId:  1,
    });

    campaign.save().then(function(){
      var otherCampaign = api.models.campaign.build({
        teamId:      1,
        name:        'my campaign',
        description: 'my campaign',
        type:        'simple',
        folder:      'default',
        transport:   'smtp',
        listId:      1,
        templateId:  1,
      });

      otherCampaign.save().then(function(){
        throw new Error('should not get here');
      }).catch(function(errors){
        errors.errors.length.should.equal(1);
        errors.errors[0].message.should.equal('campaigns_team_id_name must be unique');
        done();
      });
    });
  });

  it('will not create new campaigns with invalid params (bad type)', function(done){
    campaign = api.models.campaign.build({
      teamId:      1,
      name:        'my campaign',
      description: 'my campaign',
      type:        'wacky',
      folder:      'default',
      transport:   'smtp',
      listId:      1,
      templateId:  1,
    });

    campaign.save().then(function(){
      throw new Error('should not get here');
    }).catch(function(errors){
      errors.errors.length.should.equal(1);
      errors.errors[0].message.should.equal('type is invalid');
      done();
    });
  });

  it('returns valid types', function(done){
    campaign = api.models.campaign.build();
    var validTypes = campaign.validTypes().should.deepEqual(['simple', 'recurring', 'trigger']);
    done();
  });

});
