var async = require('async');

var alias = function(api){
  return api.env + '-' + 'people';
};

var guidListFormatter = function(p){
  if(Array.isArray(p)){ return p; }
  p = p.replace(/\s/g, '');
  return p.split(',');
};

exports.listPeopleAdd = {
  name:                   'list:people:add',
  description:            'list:people:add',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    userGuids: {
      required: false,
      formatter: guidListFormatter
    },
    file: {
      required: false
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      var jobs = [];
      if(!list){ return next(new Error('list not found')); }
      if(list.type !== 'static'){ return next(new Error('you can only modify static list membership via this method')); }

      if(data.params.userGuids){
        data.params.userGuids.forEach(function(userGuid){
          jobs.push(function(done){
            var person = new api.models.person(alias(api), userGuid);
            person.hydrate(function(error){
              if(error){ return done(new Error('Error adding guid #' + userGuid)); }
              api.models.listPerson.findOrCreate({
                where:{ userGuid: userGuid, listId: list.id }
              }).then(function(){
                done();
              }).catch(done);
            });
          });
        });
      }

      else if(data.params.file){
        // TODO: this
      }

      if(jobs.length === 0){ return next(new Error('nothing to edit')); }
      async.series(jobs, function(error){
        if(!error){ api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'default', next); }
        else{ return next(error); }
      });
    }).catch(next);
  }
};

exports.listPeopleDestroy = {
  name:                   'list:people:destroy',
  description:            'list:people:destroy',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    userGuids: {
      required: false,
      formatter: guidListFormatter
    },
    file: {
      required: false
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      var jobs = [];
      if(!list){ return next(new Error('list not found')); }
      if(list.type !== 'static'){ return next(new Error('you can only modify static list membership via this method')); }

      if(data.params.userGuids){
        data.params.userGuids.forEach(function(userGuid){
          jobs.push(function(done){
            api.models.listPerson.find({
              where:{ userGuid: userGuid, listId: list.id }
            }).then(function(listPerson){
              if(!listPerson){ return done(); }
              listPerson.destroy().then(function(){
                return done();
              }).catch(done);
            }).catch(done);
          });
        });
      }

      else if(data.params.file){
        // TODO: this
      }

      if(jobs.length === 0){ return next(new Error('nothing to edit')); }
      async.series(jobs, function(error){
        if(!error){ api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'default', next); }
        else{ return next(error); }
      });
    }).catch(next);
  }
};

exports.listPeopleCount = {
  name:                   'list:people:count',
  description:            'list:people:count',
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

      data.response.list = list.apiData(api);
      api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'default', next);
    }).catch(next);
  }
};

exports.listPeopleView = {
  name:                   'list:people:view',
  description:            'list:people:view',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
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
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {id: data.params.listId}}).then(function(list){
      if(!list){ return next(new Error('list not found')); }

      api.models.listPerson.findAndCountAll({
        where: { listId: data.params.listId },
        order: 'userGuid asc',
        offset: data.params.from,
        limit: data.params.size,
      }).then(function(response){
        data.response.total = response.count;
        var userGuids = [];

        response.rows.forEach(function(listPerson){
          userGuids.push( listPerson.userGuid );
        });

        api.elasticsearch.mget((api.env + '-people'), userGuids, function(error, results){
          if(error){ return next(error); }
          data.response.people = results;
          next();
        });

      }).catch(next);

    }).catch(next);
  }
};
