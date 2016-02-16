var dateformat = require('dateformat');

var alias = function(api){
  return api.env + '-' + 'people';
};

var index = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return alias(api) + '-' + thisMonth;
};

exports.personCreate = {
  name:                   'person:create',
  description:            'person:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: false },
    data:         { required: true  },
    permissions:  { required: false },
  },

  run: function(api, data, next){
    var person = new api.models.person(index(api));
    if(data.params.guid){        person.data.guid = data.params.guid;               }
    if(data.params.permissions){ person.data.permissions = data.params.permissions; }

    for(var i in data.params.data){
      if(person.data[i] === null || person.data[i] === undefined){
        person.data[i] = data.params.data[i];
      }
    }

    person.create(function(error, response){
      if(!error){ data.response.guid = person.data.guid; }
      next(error);
    });
  }
};

exports.personEdit = {
  name:                   'person:edit',
  description:            'person:edit',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
    data:         { required: true  },
    permissions:  { required: false },
  },

  run: function(api, data, next){
    var person = new api.models.person(index(api), data.params.guid);
    if(data.params.permissions){ person.data.permissions = data.params.permissions; }

    for(var i in data.params.data){
      if(person.data[i] === null || person.data[i] === undefined){
        person.data[i] = data.params.data[i];
      }
    }

    person.edit(next);
  }
};

exports.personView = {
  name:                   'person:view',
  description:            'person:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
  },

  run: function(api, data, next){
    var person = new api.models.person(alias(api), data.params.guid);
    person.hydrate(function(error){
      if(error){ return next(error); }
      data.response.person = person.data;
      next();
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
    var person = new api.models.person(alias(api), data.params.guid);
    person.delete(function(error){
      if(error){ return next(error); }
      next();
    });
  }
};
