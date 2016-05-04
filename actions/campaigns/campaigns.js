exports.campaignsList = {
  name:                   'campaigns:list',
  description:            'campaigns:list',
  outputExample:          {},
  middleware:             [ 'logged-in-session' ],

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
  },

  run: function(api, data, next){

    var query = {
      order: 'folder asc, name asc',
      offset: data.params.from,
      limit: data.params.size,
    }

    if(data.params.folder){
      query.where = { folder: data.params.folder };
    }

    api.models.campaign.findAndCountAll(query).then(function(response){
      data.response.total = response.count;
      data.response.campaigns = [];

      response.rows.forEach(function(campaign){
        data.response.campaigns.push( campaign.apiData(api) );
      });

      next();
    }).catch(next);
  }
};
