var Sequelize = require('sequelize');
var async     = require('async');

var loader = function(api){

  /*--- Priave Methods ---*/

  var validTypes = ['dynamic', 'static'];

  var extractor = function(arr){
    var guids = [];
    if(!arr || arr.length === 0){ return guids; }

    arr.forEach(function(e){
      if(e.personGuid){ guids = guids.concat(e.personGuid); }
      else if(e.guid){ guids = guids.concat(e.guid); }
    });

    return guids;
  };

  /*--- Public Model ---*/

  return {
    name: 'list',
    model: api.sequelize.sequelize.define('list',
      {
        'teamId': {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        'name': {
          type: Sequelize.STRING,
          allowNull: false,
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default',
        },
        'type': {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            validTypes: function(value){
              if(validTypes.indexOf(value) < 0){
                throw new Error('type is invalid');
              }
            }
          }
        },
        'personQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function(){
            var q = this.getDataValue('personQuery');
            if(q && q.length > 0){
              return JSON.parse(q);
            }else{
              return q;
            }
          },
          set: function(q){
            if(q && typeof q !== 'string'){
              q = JSON.stringify(q);
            }
            this.setDataValue('personQuery', q);
          }
        },
        'eventQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function(){
            var q = this.getDataValue('eventQuery');
            if(q && q.length > 0){
              return JSON.parse(q);
            }else{
              return q;
            }
          },
          set: function(q){
            if(q && typeof q !== 'string'){
              q = JSON.stringify(q);
            }
            this.setDataValue('eventQuery', q);
          }
        },
        'messageQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function(){
            var q = this.getDataValue('messageQuery');
            if(q && q.length > 0){
              return JSON.parse(q);
            }else{
              return q;
            }
          },
          set: function(q){
            if(q && typeof q !== 'string'){
              q = JSON.stringify(q);
            }
            this.setDataValue('messageQuery', q);
          }
        },

        'peopleCount': {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        'peopleCountedAt': {
          type: Sequelize.DATE,
          allowNull: true,
        },
      },

      {
        instanceMethods: {
          validTypes: function(){
            return validTypes;
          },

          associateListPeople: function(callback){
            var list = this;

            if(list.type === 'static'){

              api.models.listPerson.count({where: {listId: list.id}}).then(function(count){
                callback(null, count);
              }).catch(callback);

            }else{
              var jobs = [];

              var queryResults = {
                people: false,
                events: false,
                messages: false,
                final: [],
              };

              var team = api.utils.determineActionsTeam({params: {teamId: list.teamId}});

              [
                {alias: api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'people',   q: list.personQuery,  set: 'people'  },
                {alias: api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'events',   q: list.eventQuery,   set: 'events'  },
                {alias: api.utils.cleanTeamName(team.name) + '-' + api.env + '-' + 'messages', q: list.messageQuery, set: 'messages'},
              ].forEach(function(collection){
                if(collection.q){
                  jobs.push(function(done){
                    api.elasticsearch.scroll(collection.alias, collection.q, ['guid', 'personGuid'], function(error, data, count){
                      if(error){ return done(error); }
                      queryResults[collection.set] = extractor(data);
                      done();
                    });
                  });
                }
              });

              jobs.push(function(done){
                var o = {};
                var needed = 0;
                queryResults.final = [];

                ['people', 'events', 'messages'].forEach(function(type){
                  if(queryResults[type] !== false){
                    needed++;
                    queryResults[type].forEach(function(guid){
                      if(!o[guid]){ o[guid] = 0; }
                      o[guid] = o[guid] + 1;
                    });
                  }
                });

                Object.keys(o).forEach(function(guid){
                  if(o[guid] === needed){ queryResults.final.push(guid); }
                });

                done();
              });

              jobs.push(function(done){
                api.models.listPerson.destroy({
                  where: {listId: list.id}
                }).then(function(){
                  done();
                }).catch(done);
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
                callback(error, queryResults.final.length);
              });
            }
          },

          apiData: function(){
            return {
              id:           this.id,
              name:         this.name,
              folder:       this.folder,
              type:         this.type,

              personQuery:  this.personQuery,
              eventQuery:   this.eventQuery,
              messageQuery: this.messageQuery,

              peopleCount:     this.peopleCount,
              peopleCountedAt: this.peopleCountedAt,

              createdAt:    this.createdAt,
              updatedAt:    this.updatedAt,
            };
          }
        }
      }
    )
  };

};

module.exports = loader;
