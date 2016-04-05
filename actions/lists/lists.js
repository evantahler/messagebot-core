exports.listsList = {
  name:                   'lists:list',
  description:            'lists:list',
  outputExample:          {},
  middleware:             [ 'logged-in-session' ],

  inputs: {},

  run: function(api, data, next){

    api.models.list.findAll().then(function(lists){
      data.response.lists = [];
      lists.forEach(function(list){
        data.response.lists.push( list.apiData(api) );
      });

      next();
    }).catch(next);
  }
};
