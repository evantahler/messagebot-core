exports.listsList = {
  name:                   'lists:list',
  description:            'lists:list',
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

    api.models.list.findAndCountAll(query).then(function(response){
      data.response.total = response.count;
      data.response.lists = [];

      response.rows.forEach(function(list){
        data.response.lists.push( list.apiData(api) );
      });

      next();
    }).catch(next);
  }
};
