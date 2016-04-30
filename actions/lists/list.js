var async = require('async');

var JSONValidator = function(p){
  if(p === null){ return true; }
  if(p.indexOf())
  try{
    var o =JSON.parse(p);
    if (o && typeof o === "object" && o !== null){
      return true;
    }else{
      return new Error('not valid JSON');
    }
  }catch(e){
    return new Error('not valid JSON');
  }
}

var JSONFormatter = function(p){
  if(p === '' || p === null){ return null; }
  else{ return p; }
}

var listTypes = ['dynamic', 'static'];
var listTypeValidator = function(p){
  if(listTypes.indexOf(p) < 0){
    return new Error('type must be one of [' + listTypes.join(', ') + ']');
  }else{
    return true;
  }
}

exports.listCreate = {
  name:                   'list:create',
  description:            'list:create',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name:   { required: true },
    folder: {
      required: true,
      defualt: function(){ return 'default'; }
    },
    type: {
      required: true,
      defualt: function(){ return listTypes[0]; },
      validator: listTypeValidator
    },

    personQuery:    {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter,
    },
    eventQuery:    {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter,
    },
    messageQuery:    {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter,
    },
  },

  run: function(api, data, next){
    var list = api.models.list.build(data.params);

    list.save().then(
      api.models.list.findOne({where: {name: data.params.name}})
    ).then(function(listObj){
      data.response.list = listObj.apiData(api);
      api.tasks.enqueue('lists:peopleCount', {listId: listObj.id}, 'default', next);
    }).catch(function(errors){
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
    },
    includeGuids: {
      required: true,
      default: false,
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

exports.listCopy = {
  name:                   'list:copy',
  description:            'list:copy',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name: { required: true },
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      var newList = api.models.list.build({
        name:         data.params.name,
        folder:       list.folder,
        type:         list.type,
        personQuery:  list.personQuery,
        eventQuery:   list.eventQuery,
        messageQuery: list.messageQuery,
      });
      newList.save().then(function(){
        data.response.list = newList.apiData(api);

        // TODO: Paginate this or do in batches.
        // https://github.com/sequelize/sequelize/issues/2454
        api.models.listPerson.findAll({where: {listId: list.id}}).then(function(listPeople){
          var jobs = [];

          listPeople.forEach(function(listPerson){
            jobs.push(function(done){
              var newListPerson = api.models.listPerson.build({
                userGuid: listPerson.userGuid,
                listId: newList.id
              });
              newListPerson.save().then(function(){
                done();
              }).catch(function(errors){
                done(errors.errors[0].message);
              });
            });
          });

          jobs.push(function(done){
            api.tasks.enqueue('lists:peopleCount', {listId: newList.id}, 'default', done);
          });

          async.series(jobs, next);
        });
      }).catch(function(errors){
        next(errors.errors[0].message);
      });
    }).catch(next);
  }
};

exports.listEdit = {
  name:                   'list:edit',
  description:            'list:edit',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name:   { required: false },
    folder: { required: false },
    type:   {
      required: false,
      validator: listTypeValidator
    },

    personQuery:    {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter,
    },
    eventQuery:    {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter,
    },
    messageQuery:    {
      required: false,
      validator: JSONValidator,
      formatter: JSONFormatter,
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
        api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'default', next);
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
      api.models.listPerson.destroy({where: {listId: list.id}}).then(function(){
          list.destroy().then(function(){
          next();
        }).catch(next);
      }).catch(next);
    }).catch(next);
  }
};
