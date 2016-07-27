exports.listsTypes = {
  name:                   'lists:types',
  description:            'lists:types',
  outputExample:          {},
  middleware:             ['logged-in-session'],
  inputs:                 {},
  run: function(api, data, next){
    data.response.validTypes = api.models.list.build().validTypes();
    next();
  }
};

exports.listsList = {
  name:                   'lists:list',
  description:            'lists:list',
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
    order: {
      required: false,
      default: [
        ['name', 'asc'],
        ['createdAt', 'desc']
      ]
    }
  },

  run: function(api, data, next){

    var query = {
      where: { teamId: data.session.teamId },
      order: data.params.order,
      offset: data.params.from,
      limit: data.params.size,
    };

    if(data.params.folder){
      query.where.folder = data.params.folder;
    }

    api.models.list.findAndCountAll(query).then(function(response){
      data.response.total = response.count;
      data.response.lists = [];

      response.rows.forEach(function(list){
        data.response.lists.push(list.apiData());
      });

      next();
    }).catch(next);
  }
};

exports.listsFolders = {
  name:                   'lists:folders',
  description:            'lists:folders',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {},

  run: function(api, data, next){
    api.models.list.aggregate('folder', 'DISTINCT', {where: {teamId: data.session.teamId}, plain: false}).then(function(response){
      data.response.folders = [];
      response.forEach(function(r){ data.response.folders.push(r.DISTINCT); });
      data.response.folders.sort();
      next();
    }).catch(next);
  }
};
