exports.personCreate = {
  name:                   'person:create',
  description:            'person:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    sync:         { required: true, default: false },
    guid:         { required: false },
    data:         { required: true  },
    permissions:  { required: false },
    source:       { required: true },
    createdAt:    {
      required: false,
      formatter: function(p){
        return new Date(parseInt(p));
      }
    },
  },

  run: function(api, data, next){
    var person = new api.models.person();
    if(data.params.guid){        person.data.guid = data.params.guid;               }
    if(data.params.source){      person.data.source = data.params.source;           }
    if(data.params.permissions){ person.data.permissions = data.params.permissions; }
    if(data.params.createdAt){   person.data.createdAt = data.params.createdAt;     }

    for(var i in data.params.data){
      if(person.data[i] === null || person.data[i] === undefined){
        person.data[i] = data.params.data[i];
      }
    }

    // return without waiting for the crete callback; log errors
    // this effectivley allows the tracking request to 'buffer' in RAM & returning to the client quickly
    // guid will be hydrated syncrhonusly before the save operation
    if(data.params.sync === false){
      person.create(function(error){
        if(error){ api.log('person creation error: ' + error, 'error', data.params); }
      });
      data.response.guid = person.data.guid;
      next();
    }else{
      person.create(function(error){
        if(!error){ data.response.guid = person.data.guid; }
        next(error);
      });
    }
  }
};

exports.personEdit = {
  name:                   'person:edit',
  description:            'person:edit',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
    source:       { required: false },
    data:         { required: true  },
    permissions:  { required: false },
  },

  run: function(api, data, next){
    var person = new api.models.person(data.params.guid);
    if(data.params.permissions){ person.data.permissions = data.params.permissions; }
    if(data.params.source){      person.data.source = data.params.source;           }

    for(var i in data.params.data){ person.data[i] = data.params.data[i]; }

    person.edit(function(error){
      if(error){ return next(error); }
      data.response.person = person.data;
      next();
    });
  }
};

exports.personView = {
  name:                   'person:view',
  description:            'person:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid: { required: true },
  },

  run: function(api, data, next){
    var person = new api.models.person(data.params.guid);
    person.hydrate(function(error){
      if(error){ return next(error); }
      data.response.person = person.data;
      data.response.lists = [];

      api.models.listPerson.findAll({where: {
        personGuid: person.data.guid
      }, include: [api.models.list]}).then(function(listPeople){
        listPeople.forEach(function(listPerson){
          var d = listPerson.list.apiData(api);
          d.joinedAt = listPerson.createdAt;
          data.response.lists.push(d);
        })
        next();
      }).catch(next);
    });
  }
};

exports.personDelete = {
  name:                   'person:delete',
  description:            'person:delete',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
  },

  run: function(api, data, next){
    var person = new api.models.person(data.params.guid);
    person.hydrate(function(error){
      if(error){ return next(error); }
      api.models.listPerson.destroy({
        where: {personGuid: person.data.guid}
      }).then(function(){
        person.delete(function(error){
          if(error){ return next(error); }
          next();
        });
      }).catch(next);
    });
  }
};
