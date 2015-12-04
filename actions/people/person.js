var dateformat = require('dateformat');

var alias = function(api){
  return  'people';
};

var index = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return api.env + '-' + alias(api) + '-' + thisMonth;
};

exports.personCreate = {
  name:                   'person:create',
  description:            'person:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    uuid:         { required: false },
    data:         { required: true  },
    permissions:  { required: false },
  },

  run: function(api, data, next){
    var person = new api.models.person(index(api));
    if(data.params.uuid){        person.data.uuid = data.params.uuid;               }
    if(data.params.permissions){ person.data.permissions = data.params.permissions; }

    for(var i in data.params.data){
      if(person.data[i] === null || person.data[i] === undefined){
        person.data[i] = data.params.data[i];
      }
    }

    person.create(next);
  }
};

exports.personEdit = {
  name:                   'person:edit',
  description:            'person:edit',
  outputExample:          {},
  middleware:             [],

  inputs: {
    uuid:         { required: true },
    data:         { required: true  },
    permissions:  { required: false },
  },

  run: function(api, data, next){
    var person = new api.models.person(index(api), data.params.uuid);
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
    uuid:         { required: true },
  },

  run: function(api, data, next){
    var person = new api.models.person(alias(api), data.params.uuid);
    person.hydrate(function(error){
      if(error){ return next(error); }
      data.response.person = person.data;
      next();
    });
  }
};

exports.search = {
  name:                   'person:search',
  description:            'person:search',
  outputExample:          {},
  middleware:             [],

  inputs: {
    searchKeys:   { required: true },
    searchValues: { required: true },
  },

  run: function(api, data, next){
    api.elasticsearch.search(alias(api), data.params.searchKeys, data.params.searchValues, function(error, results){
      if(error){ return next(error); }
      data.response.people = results;
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
    uuid:         { required: true },
  },

  run: function(api, data, next){
    var person = new api.models.person(alias(api), data.params.uuid);
    person.delete(function(error){
      if(error){ return next(error); }
      next();
    });
  }
};