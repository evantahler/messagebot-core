var async = require('async');

module.exports = {
  initialize: function(api, next){

    api.lists = {};

    api.lists.getPeople = function(listId, callback){
      var jobs = [];
      var queryResults = {
        people: false,
        events: false,
        messages: false,
        final: [],
      };

      var extractor = function(arr){
        var guids = [];
        if(!arr || arr.length === 0){ return guids; }

        arr.forEach(function(e){
          if(e.personGuid){ guids = guids.concat(e.personGuid); }
          else if(e.guid){ guids = guids.concat(e.guid); }
        });

        return guids;
      };

      // load the collection of people which would match the `peopleQuery`, `eventQuery`, and `messageQuery`
      // and then take the goup of folks who match all sections
      // TODO: We'll need to parallelize this one day, store the GUIDs in redis or something, as to not store all the data in RAM
      api.models.list.findOne({where: {id: listId}}).then(function(list){
        if(!list){ return callback(new Error('list not found')); }

        if(list.personQuery && list.personQuery !== ''){
          jobs.push(function(done){
            var alias = api.env + '-people';
            api.elasticsearch.scroll(api, alias, list.personQuery, ['guid', 'personGuid'], function(error, data, count){
              if(error){ return done(error); }
              queryResults.people = extractor(data);
              done();
            });
          });
        }

        if(list.eventQuery && list.eventQuery !== ''){
          jobs.push(function(done){
            var alias = api.env + '-events';
            api.elasticsearch.scroll(api, alias, list.eventQuery, ['guid', 'personGuid'], function(error, data, count){
              if(error){ return done(error); }
              queryResults.events = extractor(data);
              done();
            });
          });
        }

        if(list.messageQuery && list.messageQuery !== ''){
          jobs.push(function(done){
            var alias = api.env + '-messages';
            api.elasticsearch.scroll(api, alias, list.messageQuery, ['guid', 'personGuid'], function(error, data, count){
              if(error){ return done(error); }
              queryResults.messages = extractor(data);
              done();
            });
          });
        }

        jobs.push(function(done){
          var uniqueGuids = [];
          var guidsToRemove = [];

          ['people', 'events', 'messages'].forEach(function(type){
            if(queryResults[type] !== false){
              uniqueGuids = uniqueGuids.concat(queryResults[type]);
            }
          });

          uniqueGuids = api.utils.arrayUniqueify(uniqueGuids);
          if(uniqueGuids.length === 0){ return done(); }

          ['people', 'events', 'messages'].forEach(function(type){
            if(queryResults[type] !== false){
              uniqueGuids.forEach(function(guid){
                if(queryResults[type].indexOf(guid) < 0){
                  guidsToRemove.push(guid);
                }
              });
            }
          });

          guidsToRemove = api.utils.arrayUniqueify(guidsToRemove);
          guidsToRemove.forEach(function(guid){
            uniqueGuids.splice(uniqueGuids.indexOf(guid), 1);
          });

          queryResults.final = uniqueGuids;
          process.nextTick(done);
        });

        jobs.push(function(done){
          api.models.listPerson.destroy({
            where: {listId: list.id}
          }).then(function(){
            done();
          }).catch(next);
        });

        jobs.push(function(done){
          var bulk = [];

          queryResults.final.forEach(function(personGuid){
            bulk.push({
              personGuid: personGuid,
              teamId: list.teamId,
              listId: list.id,
            });
          });

          api.models.listPerson.bulkCreate(bulk, {validate: true}).then(function(){
            done();
          }).catch(done);
        });


        async.series(jobs, function(error){
          callback(error, queryResults.final);
        });

      });
    };

    next();
  }
};
