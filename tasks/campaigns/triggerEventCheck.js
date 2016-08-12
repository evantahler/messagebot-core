'use strict';

var async = require('async');

exports.task = {
  name:          'campaigns:triggerEventCheck',
  description:   'campaigns:triggerEventCheck',
  frequency:     0,
  queue:         'messagebot:campaigns',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var jobs = [];
    var toSend = false;

    // TODO: Only recount so often...
    // This could get really slow..
    jobs.push(function(done){
      api.models.list.findOne({
        where: {id: params.listId}
      }).then(function(list){
        if(!list){ return done(new Error('list not found')); }
        list.associateListPeople(done);
      }).catch(done);
    });

    jobs.push(function(done){
      api.models.listPerson.findOne({where: {
        teamId: params.teamId,
        personGuid: params.personGuid,
        listId: params.listId,
      }}).then(function(listPerson){
        if(listPerson){ toSend = true; }
        done();
      }).catch(done);
    });

    jobs.push(function(done){
      if(toSend === true){
        api.tasks.enqueue('campaigns:sendMessage', {
          listId: params.listId,
          campaignId: params.campaignId,
          personGuid: params.personGuid,
        }, 'messagebot:campaigns', done);
      }else{ done(); }
    });

    async.series(jobs, next);
  }
};
