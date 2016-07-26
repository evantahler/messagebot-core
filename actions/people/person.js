var async = require('async');

exports.personCreate = {
  name:                   'person:create',
  description:            'person:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    teamId:       { required: false, formatter: function(p){ return parseInt(p); } },
    sync:         { required: true, default: false },
    guid:         { required: false },
    data:         { required: false, default: {} },
    source:       { required: true },
    createdAt:    {
      required: false,
      formatter: function(p){
        return new Date(parseInt(p));
      }
    }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var person = new api.models.person(team);

    if(data.params.guid){        person.data.guid = data.params.guid;               }
    if(data.params.source){      person.data.source = data.params.source;           }
    if(data.params.createdAt){   person.data.createdAt = data.params.createdAt;     }

    for(var i in data.params.data){
      if(person.data[i] === null || person.data[i] === undefined){
        person.data[i] = data.params.data[i];
      }
    }

    // location and device will be updated by events as they come in
    person.data.location = {lat: 0, lon: 0};
    person.data.device = 'unknown';

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
    teamId:       { required: false, formatter: function(p){ return parseInt(p); } },
    guid:         { required: true },
    source:       { required: false },
    data:         { required: true  }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var person = new api.models.person(team, data.params.guid);

    if(data.params.source){ person.data.source = data.params.source; }

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
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }
    var person = new api.models.person(team, data.params.guid);

    person.hydrate(function(error){
      if(error){ return next(error); }
      data.response.person = person.data;
      data.response.lists = [];

      api.models.listPerson.findAll({where: {
        personGuid: person.data.guid
      }, include: [api.models.list]}).then(function(listPeople){
        listPeople.forEach(function(listPerson){
          var d = listPerson.list.apiData();
          d.joinedAt = listPerson.createdAt;
          data.response.lists.push(d);
        });

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
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var jobs = [];
    var team;
    var person;

    jobs.push(function(done){
      team = api.utils.determineActionsTeam(data);
      if(!team){ return done(new Error('Team not found for this request')); }
      done();
    });

    jobs.push(function(done){
      person = new api.models.person(team, data.params.guid);
      person.hydrate(done);
    });

    jobs.push(function(done){
      api.models.listPerson.destroy({
        where: {
          personGuid: person.data.guid,
          teamId: team.id,
        }
      }).then(function(){
        done();
      }).catch(done);
    });

    [
      ['events', 'event'],
      ['messages', 'message'],
    ].forEach(function(typeGroup){
      jobs.push(function(done){
        // since the delete operation is async, we need to keep track of what we have already trigged to delete
        // otherwise our delete operation will error
        var deletedGuids = [];

        var total = 1;
        var alias = api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + typeGroup[0];
        async.whilst(function(){
          if(total > 0){ return true; }
          return false;
        }, function(again){

          api.elasticsearch.search(
            alias,
            ['personGuid'],
            [person.data.guid],
            0,
            1000,
            null,
            1,
            function(error, results, _total){
              if(error){ return again(error); }
              total = _total;
              var deleteJobs = [];
              results.forEach(function(result){
                if(deletedGuids.indexOf(result.guid) < 0){
                  deleteJobs.push(function(deleteDone){
                    deletedGuids.push(result.guid);
                    var instnce = new api.models[typeGroup[1]](team, result.guid);
                    instnce.del(deleteDone);
                  });
                }
              });

              async.series(deleteJobs, function(error){
                if(error){ return again(error); }
                setTimeout(again, 500);
              });
            }
          );
        }, done);
      });
    });

    jobs.push(function(done){
      person.del(done);
    });

    async.series(jobs, next);
  }
};
