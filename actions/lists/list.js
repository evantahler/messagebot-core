var JSONValidator = function(p){
  try{
    JSON.parse(p);
    return true;
  }catch(e){
    return new Error('not valid JSON');
  }
}

exports.listCreate = {
  name:                   'list:create',
  description:            'list:create',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    type:   { required: true },
    name:   { required: true },
    folder: { required: true },

    userQuery:    {
      required: true,
      validator: JSONValidator
    },
    eventQuery:    {
      required: true,
      validator: JSONValidator
    },
    messageQuery:    {
      required: true,
      validator: JSONValidator
    },
  },

  run: function(api, data, next){
    var list = api.models.list.build(data.params);

    list.save().then(
      api.models.list.findOne({where: {name: data.params.name}})
    ).then(function(listObj){
      data.response.list = listObj.apiData(api);
      next(error);
    })
    .catch(function(errors){
      next(errors.errors[0].message);
    });
  }
};

exports.listView = {
  name:                   'list:view',
  description:            'list:view',
  outputExample:          {},
  middleware:             [ 'logged-in-session' ],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      data.response.list = list.apiData(api);
      next();
    }).catch(next);
  }
};

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

exports.listEdit = {
  name:                   'list:edit',
  description:            'list:edit',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    type:   { required: true },
    name:   { required: true },
    folder: { required: true },

    userQuery:    {
      required: true,
      validator: JSONValidator
    },
    eventQuery:    {
      required: true,
      validator: JSONValidator
    },
    messageQuery:    {
      required: true,
      validator: JSONValidator
    },
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      if(!list){ return next(new Error('list not found')); }

      list.updateAttributes(data.params).then(function(){
        data.response.list = list.apiData(api);
        next();
      }).catch(next);
    }).catch(next);
  }
};

exports.listDelete = {
  name:                   'list:delete',
  description:            'list:delete',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      list.destroy().then(function(){ next(); }).catch(next);
    }).catch(next);
  }
};
