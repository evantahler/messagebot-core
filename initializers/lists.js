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

      // load the collection of people which would match the `peopleQuery`, `eventQuery`, and `messageQuery`
      // and then take the goup of folks who match all sections
      // TODO: We'll need to parallelize this one day, store the GUIDs in redis or something, as to not store all the data in RAM
      api.models.list.findOne({where: {id: listId}}).then(function(list){
        if(!list){ return callback(new Error('list not found')); }

        if(list.personQuery && list.personQuery !== ''){
          jobs.push(function(done){
            var alias = api.env + '-people';
            api.elasticsearch.scroll(alias, list.personQuery, function(error, data, count){
              if(error){ return done(error); }
              queryResults.people = data;
              done();
            });
          });
        }

        if(list.eventQuery && list.eventQuery !== ''){
          jobs.push(function(done){
            var alias = api.env + '-events';
            api.elasticsearch.scroll(alias, list.eventQuery, function(error, data, count){
              if(error){ return done(error); }
              queryResults.events = data;
              done();
            });
          });
        }

        if(list.messageQuery && list.messageQuery !== ''){
          jobs.push(function(done){
            var alias = api.env + '-messages';
            api.elasticsearch.scroll(alias, list.messageQuery, function(error, data, count){
              if(error){ return done(error); }
              queryResults.messages = data;
              done();
            });
          });
        }

        jobs.push(function(done){
          var uniqueGuids = [];

          ['people', 'events', 'messages'].forEach(function(type){
            if(queryResults[type] !== false){ uniqueGuids = uniqueGuids.concat(queryResults[type]); }
          });

          uniqueGuids = api.utils.arrayUniqueify(uniqueGuids);

          if(uniqueGuids.length === 0){ return done(); }

          ['people', 'events', 'messages'].forEach(function(type){
            if(queryResults[type] !== false){
              uniqueGuids.forEach(function(guid){
                if(queryResults[type].indexOf(guid) < -1){
                  uniqueGuids.splice( uniqueGuids.indexOf(guid), 1 );
                }
              });
            }
          });

          queryResults.final = uniqueGuids;
          process.nextTick(done);
        });

        jobs.push(function(done){
          api.models.listPerson.destroy({where: {listId: list.id}}).then(function(){
            done();
          });
        });

        jobs.push(function(done){
          var listPersonJobs = [];

          queryResults.final.forEach(function(personGuid){
            listPersonJobs.push(function(cb){
              var listPerson = api.models.listPerson.build({
                personGuid: personGuid,
                listId: list.id,
              });

              listPerson.save().then(function(){
                cb();
              }).catch(done);
            });
          });

          async.parallelLimit(listPersonJobs, 10, done);
        });


        async.series(jobs, function(error){
          callback(error, queryResults.final);
        });

      });
    };

    next();
  }
}
