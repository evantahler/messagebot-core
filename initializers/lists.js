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
      api.models.list.findOne({where: {id: listId}}).then(function(list){
        if(!list){ return callback(new Error('list not found')); }

        if(list.personQuery && list.personQuery != ''){
          jobs.push(function(done){
            var alias = api.env + '-people';
            api.elasticsearch.scroll(alias, list.personQuery, function(error, data, count){
              if(error){ return done(error); }
              queryResults.people = [];
              data.forEach(function(d){ queryResults.people.push(p.guid); });
              done();
            });
          });
        }

        if(list.eventQuery && list.eventQuery != ''){
          jobs.push(function(done){
            var alias = api.env + '-events';
            api.elasticsearch.scroll(alias, list.eventQuery, function(error, data, count){
              if(error){ return done(error); }
              queryResults.events = [];
              data.forEach(function(d){ queryResults.events.push(p.userGuid); });
              done();
            });
          });
        }

        if(list.messageQuery && list.messageQuery != ''){
          jobs.push(function(done){
            var alias = api.env + '-messages';
            api.elasticsearch.scroll(alias, list.messageQuery, function(error, data, count){
              if(error){ return done(error); }
              queryResults.messages = [];
              data.forEach(function(d){ queryResults.messages.push(p.userGuid); });
              done();
            });
          });
        }

        jobs.push(function(done){
          var uniqueGuids = [];
          ['people', 'events', 'messages'].forEach(function(type){
            if(queryResults[type] !== false){ uniqueGuids.concat(queryResults[type]); }
          });

          uniqueGuids = api.utils.arrayUniqueify(uniqueGuids);

          if(uniqueGuids.length === 0){ return done(); }

          ['people', 'events', 'messages'].forEach(function(type){
            if(queryResults[type] !== false){
              uniqueGuids.forEach(function(guid){
                if(queryResults[type].indexOf(guid) < 1){
                  uniqueGuids.splice( uniqueGuids.indexOf(guid), 1 );
                }
              });
            }
          });

          queryResults.final = uniqueGuids;
          process.nextTick(done);
        });

        jobs.push(function(done){
          // TODO: Update the 'people' and note what lists they fall into
          done();
        });

        async.series(jobs, function(error){
          callback(error, queryResults.final);
        });

      });
    };

    next();
  }
}
