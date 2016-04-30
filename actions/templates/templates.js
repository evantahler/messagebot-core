exports.templatesList = {
  name:                   'templates:list',
  description:            'templates:list',
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
    folder: {
      required: true,
      default:   function(){ return 'default'; },
    },
  },

  run: function(api, data, next){

    api.models.template.findAndCountAll({
      where: {folder: data.params.folder},
      order: 'folder asc, name asc',
      offset: data.params.from,
      limit: data.params.size,
    }).then(function(response){
      data.response.total = response.count;
      data.response.templates = [];

      response.rows.forEach(function(template){
        data.response.templates.push( template.apiData(api) );
      });

      next();
    }).catch(next);
  }
};
