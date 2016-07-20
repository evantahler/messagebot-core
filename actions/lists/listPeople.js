var async        = require('async');
var fs           = require('fs');
var csv          = require('fast-csv');

var guidListFormatter = function(p){
  if(Array.isArray(p)){ return p; }
  p = p.replace(/\s/g, '');
  return p.split(',');
};

exports.listPeopleAdd = {
  name:                   'list:people:add',
  description:            'list:people:add',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    personGuids: {
      required: false,
      formatter: guidListFormatter
    },
    file: {
      required: false
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      var jobs = [];
      if(!list){ return next(new Error('list not found')); }
      if(list.type !== 'static'){ return next(new Error('you can only modify static list membership via this method')); }

      var complete = function(){
        if(jobs.length === 0){ return next(new Error('nothing to edit')); }

        async.series(jobs, function(error){
          if(!error){ api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'messagebot:lists', next); }
          else{ return next(error); }
        });
      };

      if(data.params.personGuids){
        data.params.personGuids.forEach(function(personGuid){
          jobs.push(function(done){
            var person = new api.models.person(personGuid);
            person.hydrate(function(error){
              if(error){ return done(new Error('Error adding guid #' + personGuid + ': ' + String(error))); }
              api.models.listPerson.findOrCreate({
                where:{
                  personGuid: personGuid,
                  listId: list.id,
                  teamId: list.teamId,
                }
              }).then(function(){
                done();
              }).catch(done);
            });
          });

          complete();
        });
      }

      else if(data.params.file){
        var file = data.params.file.path;
        var fileStream = fs.createReadStream(file).on('error', next);
        var csvStream = csv({
          headers: true,
          ignoreEmpty: true,
          trim: true,
        }).on('data', function(d){
          jobs.push(function(done){
            var person = new api.models.person();

            if(d.guid){        person.data.guid = d.guid;               }
            if(d.createdAt){   person.data.createdAt = d.createdAt;     }

            for(var i in d){
              if(person.data[i] === null || person.data[i] === undefined){
                person.data[i] = d[i];
              }
            }

            person.create(function(error){
              if(error){ return done(new Error('Error adding person ' + JSON.stringify(d) + ' | ' + error)); }
              api.models.listPerson.findOrCreate({
                where:{
                  personGuid: person.data.guid,
                  listId: list.id,
                  teamId: list.teamId,
                }
              }).then(function(){
                done();
              }).catch(done);
            });
          });
        }).on('end', complete);

        fileStream.pipe(csvStream);
      }

      else{ return next(new Error('no people provided')); }
    }).catch(next);
  }
};

exports.listPeopleDelete = {
  name:                   'list:people:delete',
  description:            'list:people:delete',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    listId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    personGuids: {
      required: false,
      formatter: guidListFormatter
    },
    file: {
      required: false
    }
  },

  run: function(api, data, next){
    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      var jobs = [];
      if(!list){ return next(new Error('list not found')); }
      if(list.type !== 'static'){ return next(new Error('you can only modify static list membership via this method')); }

      if(data.params.personGuids){
        data.params.personGuids.forEach(function(personGuid){
          jobs.push(function(done){
            api.models.listPerson.find({
              where:{
                personGuid: personGuid,
                listId: list.id,
                teamId: list.teamId
              }
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
        if(!error){ api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'messagebot:lists', next); }
        else{ return next(error); }
      });
    }).catch(next);
  }
};

exports.listPeopleCount = {
  name:                   'list:people:count',
  description:            'list:people:count',
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

      data.response.list = list.apiData(api);
      api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'messagebot:lists', next);
    }).catch(next);
  }
};

exports.listPeopleView = {
  name:                   'list:people:view',
  description:            'list:people:view',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

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
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }

    api.models.list.findOne({where: {
      id: data.params.listId,
      teamId: data.session.teamId,
    }}).then(function(list){
      if(!list){ return next(new Error('list not found')); }

      api.models.listPerson.findAndCountAll({
        where: {
          listId: list.id,
          teamId: list.teamId,
        },
        order: 'personGuid asc',
        offset: data.params.from,
        limit: data.params.size,
      }).then(function(response){
        data.response.total = response.count;
        var personGuids = [];

        response.rows.forEach(function(listPerson){
          personGuids.push(listPerson.personGuid);
        });

        var alias = api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'people';
        api.elasticsearch.mget(api, alias, personGuids, function(error, results){
          if(error){ return next(error); }
          data.response.people = results;
          next();
        });

      }).catch(next);

    }).catch(next);
  }
};
