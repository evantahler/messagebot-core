exports.campaignsTypes = {
  name:                   'campaigns:types',
  description:            'campaigns:types',
  outputExample:          {},
  middleware:             ['logged-in-session'],
  inputs:                 {},
  run: function(api, data, next){
    data.response.validTypes = api.models.campaign.build().validTypes();
    next();
  }
};

exports.campaignsList = {
  name:                   'campaigns:list',
  description:            'campaigns:list',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    from: {
      required: false,
      formatter: function(p){ return parseInt(p); },
      default:   function(p){ return 0; },
    },
    size: {
      required: false,
      formatter: function(p){ return parseInt(p); },
      default:   function(p){ return 100; },
    },
    folder: { required: false },
    sent:   {
      required: false,
      default: false,
    },
    order: {
      required: false,
      default: 'sentAt DESC, createdAt DESC'
    }
  },

  run: function(api, data, next){

    var query = {
      order: 'folder asc, name asc',
      offset: data.params.from,
      limit: data.params.size,
      order: data.params.order,
    };

    query.where = {
      teamId: data.session.teamId
    };

    if(data.params.folder){
      query.where.folder = data.params.folder;
    }

    if(data.params.sent === 'true' || data.params.sent === true){
      query.where.sentAt = {$ne: null};
    }

    api.models.campaign.findAndCountAll(query).then(function(response){
      data.response.total = response.count;
      data.response.campaigns = [];

      response.rows.forEach(function(campaign){
        data.response.campaigns.push(campaign.apiData(api));
      });

      next();
    }).catch(next);
  }
};

exports.campaignsFolders = {
  name:                   'campaigns:folders',
  description:            'campaigns:folders',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {},

  run: function(api, data, next){
    api.models.campaign.aggregate('folder', 'DISTINCT', {plain: false, where: {teamId: data.session.teamId}}).then(function(response){
      data.response.folders = [];
      response.forEach(function(r){ data.response.folders.push(r.DISTINCT); });
      data.response.folders.sort();
      next();
    }).catch(next);
  }
};
