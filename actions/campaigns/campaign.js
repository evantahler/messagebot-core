var campaignTypes = ['simple', 'recurring', 'trigger'];
var campaignTypeValidator = function(p){
  if(campaignTypes.indexOf(p) < 0){
    return new Error('type must be one of [' + campaignTypes.join(', ') + ']');
  }else{
    return true;
  }
}

var transportValidator = function(p){
  var api = this;
  var transportNames = [];

  api.transports.forEach(function(t){ transportNames.push(t.name); });
  if( transportNames.indexOf(p) < 0 ){
    return new Error(p + ' is not a valid transport');
  }else{
    return true;
  }
}


exports.campaignCreate = {
  name:                   'campaign:create',
  description:            'campaign:create',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name:        { required: true },
    description: { required: true },
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    folder: {
      required: true,
      defualt: function(){ return 'default'; }
    },
    type: {
      required: true,
      defualt: function(){ return campaignTypes[0]; },
      validator: campaignTypeValidator
    },
    transport: {
      required: true,
      validator: transportValidator
    },
    sendAt: {
      required: false,
      formatter: function(p){ return new Date(parseInt(p)); }
    },
    sendOnce: {
      required: false,
    },
    triggerDelay: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
    reTriggerDelay: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
  },

  run: function(api, data, next){
    var campaign = api.models.campaign.build(data.params);

    campaign.save().then(function(){
      data.response.campaign = campaign.apiData(api);
      next();
    }).catch(function(errors){
       next(errors.errors[0].message);
    });
  }
};

exports.campaignView = {
  name:                   'campaign:view',
  description:            'campaign:view',
  outputExample:          {},
  middleware:             [ 'logged-in-session' ],

  inputs: {
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {id: data.params.campaignId}}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }
      data.response.campaign = campaign.apiData(api);
      next();
    }).catch(next);
  }
};

exports.campaignCopy = {
  name:                   'campaign:copy',
  description:            'campaign:copy',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name: { required: true },
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {id: data.params.campaignId}}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }
      var newCampaign = api.models.campaign.build({
        name:           data.params.name,
        description:    campaign.description,
        folder:         campaign.folder,
        type:           campaign.type,
        listId:         campaign.listId,
        templateId:     campaign.templateId,
        transport:      campaign.transport,
        sendAt:         campaign.sendAt,
        sendOnce:       campaign.sendOnce,
        triggerDelay:   campaign.triggerDelay,
        reTriggerDelay: campaign.reTriggerDelay,

      });
      newCampaign.save().then(function(){
        data.response.campaign = newCampaign.apiData(api);
        next();
      }).catch(function(errors){
        next(errors.errors[0].message);
      });
    }).catch(next);
  }
};

exports.campaignEdit = {
  name:                   'campaign:edit',
  description:            'campaign:edit',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name:        { required: false },
    description: { required: false },
    listId: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
    templateId: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
    folder: {
      required: false,
      defualt: function(){ return 'default'; }
    },
    type: {
      required: false,
      defualt: function(){ return campaignTypes[0]; },
      validator: campaignTypeValidator
    },
    transport: {
      required: false,
      validator: transportValidator
    },
    sendAt: {
      required: false,
      formatter: function(p){ return new Date(parseInt(p)); }
    },
    sendOnce: {
      required: false,
    },
    triggerDelay: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
    reTriggerDelay: {
      required: false,
      formatter: function(p){ return parseInt(p); }
    },
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {id: data.params.campaignId}}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }

      campaign.updateAttributes(data.params).then(function(){
        data.response.campaign = campaign.apiData(api);
        next();
      }).catch(next);
    }).catch(next);
  }
};

exports.campaignDelete = {
  name:                   'campaign:delete',
  description:            'campaign:delete',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {id: data.params.campaignId}}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }
      campaign.destroy().then(function(){
        next();
      });
    }).catch(next);
  }
};
