var async = require('async');

var JSONValidator = function(p){
  if(p === null){ return true; }
  try{
    var o = JSON.parse(p);
    if(o && typeof o === 'object' && o !== null){
      return true;
    }else{
      return new Error('not valid JSON');
    }
  }catch(e){
    return new Error('not valid JSON');
  }
};

var JSONFormatter = function(p){
  if(p === '' || p === null){ return null; }
  else{ return p; }
};

exports.listCreate = {
  name:                   'list:create',
  description:            'list:create',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    name:   { required: true },
    folder: {
      required: true,
      defualt: function(){ return 'default'; }
    },
    type: { required: true },
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
    list.teamId = data.session.teamId;

    list.save().then(
      api.models.list.findOne({where: {name: data.params.name}})
    ).then(function(listObj){
      data.response.list = listObj.apiData();
      api.tasks.enqueue('lists:peopleCount', {listId: listObj.id}, 'messagebot:lists', next);
    }).catch(function(errors){
      next(errors.errors[0].message);
    });
  }
};

exports.listView = {
  name:                   'list:view',
  description:            'list:view',
  outputExample:          {},
  middleware:             ['logged-in-session'],

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
    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      data.response.list = list.apiData();
      next();
    }).catch(next);
  }
};

exports.listCopy = {
  name:                   'list:copy',
  description:            'list:copy',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      var newList = api.models.list.build({
        name:         data.params.name,
        teamId:       list.teamId,
        folder:       list.folder,
        type:         list.type,
        personQuery:  list.personQuery,
        eventQuery:   list.eventQuery,
        messageQuery: list.messageQuery,
      });
      newList.save().then(function(){
        data.response.list = newList.apiData();

        api.utils.findInBatches(api.models.listPerson, {where: {listId: list.id}}, function(listPerson, done){
          var newListPerson = api.models.listPerson.build({
            personGuid: listPerson.personGuid,
            listId: newList.id
          });
          newListPerson.save().then(function(){
            done();
          }).catch(function(errors){
            done(errors.errors[0].message);
          });
        }, function(){
          api.tasks.enqueue('lists:peopleCount', {listId: newList.id}, 'messagebot:lists', next);
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
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    name:   { required: false },
    folder: { required: false },
    type:   { required: false },

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
    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      if(!list){ return next(new Error('list not found')); }

      list.updateAttributes(data.params).then(function(){
        data.response.list = list.apiData();
        api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'messagebot:lists', next);
      }).catch(next);
    }).catch(next);
  }
};

exports.listDelete = {
  name:                   'list:delete',
  description:            'list:delete',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      api.models.listPerson.destroy({where: {listId: list.id}}).then(function(){
        list.destroy().then(function(){
          next();
        }).catch(next);
      }).catch(next);
    }).catch(next);
  }
};
