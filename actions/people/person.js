var async = require('async');

exports.personCreate = {
  name:                   'person:create',
  description:            'person:create',
  outputExample:          {},
  middleware:             ['require-team'],

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
    var person = new api.models.person(data.team);
    person.data = data.params;

    // location and device will be updated by events as they come in

    person.data.device = 'unknown';

    // return without waiting for the crete callback; log errors
    // this effectivley allows the tracking request to 'buffer' in RAM & returning to the client quickly
    // guid will be hydrated syncrhonusly before the save operation
    if(data.params.sync === false){
      person.create(function(error){
        if(error){ return api.log('person creation error: ' + error, 'error', data.params); }
        api.tasks.enqueue('people:buildCreateEvent', {guid: person.data.guid, teamId: data.team.id}, 'messagebot:people', function(error){
          return api.log('person creation error: ' + error, 'error', data.params);
        });
      });
      data.response.guid = person.data.guid;
      next();
    }else{
      person.create(function(error){
        if(error){ return next(error); }
        data.response.guid = person.data.guid;
        api.tasks.enqueue('people:buildCreateEvent', {guid: person.data.guid, teamId: data.team.id}, 'messagebot:people', next);
      });
    }
  }
};

exports.personEdit = {
  name:                   'person:edit',
  description:            'person:edit',
  outputExample:          {},
  middleware:             ['require-team'],

  inputs: {
    teamId:       { required: false, formatter: function(p){ return parseInt(p); } },
    guid:         { required: true },
    source:       { required: false },
    data:         { required: true  }
  },

  run: function(api, data, next){
    var person = new api.models.person(data.team, data.params.guid);
    person.data = data.params;

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
  middleware:             ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var person = new api.models.person(data.team, data.params.guid);
    person.data = data.params;

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
  middleware:             ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function(p){ return parseInt(p); } },
    guid:   { required: true }
  },

  run: function(api, data, next){
    var jobs = [];
    var person;

    jobs.push(function(done){
      person = new api.models.person(data.team, data.params.guid);
      person.hydrate(done);
    });

    jobs.push(function(done){
      api.models.listPerson.destroy({
        where: {
          personGuid: person.data.guid,
          teamId: data.team.id,
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
        var alias = api.utils.cleanTeamName(data.team.name) + '-' + api.env + '-' + typeGroup[0];
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
                    var instnce = new api.models[typeGroup[1]](data.team, result.guid);
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
