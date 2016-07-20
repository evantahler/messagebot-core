var async = require('async');

var transportValidator = function(p){
  var api = this;
  var transportNames = [];

  api.transports.forEach(function(t){ transportNames.push(t.name); });
  if(transportNames.indexOf(p) < 0){
    return new Error(p + ' is not a valid transport');
  }else{
    return true;
  }
};


exports.campaignCreate = {
  name:                   'campaign:create',
  description:            'campaign:create',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

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
    type: { required: true },
    transport: {
      required: true,
      validator: transportValidator
    },
    campaignVariables: {
      required: false,
      formatter: function(p){ return JSON.parse(p); }
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
    campaign.teamId = data.session.teamId;

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
  middleware:             ['logged-in-session'],

  inputs: {
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId,
    }}).then(function(campaign){
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
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId,
    }}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }
      var newCampaign = api.models.campaign.build({
        name:              data.params.name,
        description:       campaign.description,
        folder:            campaign.folder,
        type:              campaign.type,
        listId:            campaign.listId,
        teamId:            campaign.teamId,
        templateId:        campaign.templateId,
        transport:         campaign.transport,
        campaignVariables: campaign.campaignVariables,
        // sendAt:            campaign.sendAt,
        // sendOnce:          campaign.sendOnce,
        // triggerDelay:      campaign.triggerDelay,
        // reTriggerDelay:    campaign.reTriggerDelay,

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
  middleware:             ['logged-in-session', 'role-required-admin'],

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
    type: { required: false },
    transport: {
      required: false,
      validator: transportValidator
    },
    campaignVariables: {
      required: false,
      formatter: function(p){ return JSON.parse(p); }
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
    api.models.campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId,
    }}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }

      campaign.updateAttributes(data.params).then(function(){
        data.response.campaign = campaign.apiData(api);
        next();
      }).catch(next);
    }).catch(next);
  }
};

exports.campaignStats = {
  name:                   'campaign:stats',
  description:            'campaign:stats',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    start:        {
      required: false,
      formatter: function(p){ return new Date(parseInt(p)); },
      default:   function(p){ return 0; },
    },
    end:          {
      required: false,
      formatter: function(p){ return new Date(parseInt(p)); },
      default:   function(p){ return new Date().getTime(); },
    },
    interval:          {
      required: true,
      default: 'hour',
    },
  },

  run: function(api, data, next){
    var jobs = [];
    var campaign;

    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }

    var alias = api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'messages';

    jobs.push(function(done){
      api.models.campaign.findOne({where: {
        id: data.params.campaignId,
        teamId: data.session.teamId,
      }}).then(function(_campaign){
        campaign = _campaign;
        if(!campaign){ return next(new Error('campaign not found')); }
        done();
      }).catch(done);
    });

    data.response.totals = {};

    [
      'sentAt',
      'readAt',
      'actedAt'
    ].forEach(function(term){
      jobs.push(function(done){
        api.elasticsearch.aggregation(
          api,
          alias,
          ['campaignId', term],
          [campaign.id, '_exists'],
          data.params.start,
          data.params.end,
          'createdAt',
          'date_histogram',
          'createdAt',
          data.params.interval,
          function(error, buckets){
            if(error){ return done(error); }

            data.response[term] = buckets.buckets;
            var total = 0;
            buckets.buckets.forEach(function(bucket){ total += bucket.doc_count; });
            data.response.totals[term] = total;
            done();
          }
        );
      });
    });

    async.series(jobs, next);
  }
};

exports.campaignDelete = {
  name:                   'campaign:delete',
  description:            'campaign:delete',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    campaignId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId,
    }}).then(function(campaign){
      if(!campaign){ return next(new Error('campaign not found')); }
      campaign.destroy().then(function(){
        next();
      });
    }).catch(next);
  }
};
