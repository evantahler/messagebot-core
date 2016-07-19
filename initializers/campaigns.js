var async = require('async');

var LIMIT = 1000;
var OFFSET = 0;

module.exports = {
  initialize: function(api, next){

    api.campaigns = {};

    api.campaigns.send = function(campaignId, callback){
      var jobs = [];
      var campaign;
      var list;

      jobs.push(function(done){
        api.models.campaign.findOne({where: {id: campaignId}}).then(function(c){
          campaign = c;
          if(!campaign){ return done(new Error('campaign not found')); }
          done();
        }).catch(done);
      });

      jobs.push(function(done){
        api.models.list.findOne({where: {id: campaign.listId}}).then(function(l){
          list = l;
          if(!list){ return done(new Error('list not found')); }
          done();
        }).catch(done);
      });

      jobs.push(function(done){
        campaign.updateAttributes({
          sendingAt: new Date()
        }).then(function(){
          return done();
        }).catch(done);
      });

      jobs.push(function(done){
        if(list.type === 'dynamic'){ api.lists.getPeople(list.id, done); };
      });

      jobs.push(function(done){
        if(campaign.type === 'simple'){ api.campaigns.sendSimple(campaign, list, LIMIT, OFFSET, done); }
        else if(campaign.type === 'recurring'){ api.campaigns.sendRecurring(campaign, list, LIMIT, OFFSET, done); }
        else if(campaign.type === 'trigger'){ api.campaigns.sendTrigger(campaign, list, LIMIT, OFFSET, done); }
        else{ return done(new Error('campaign type not understood')); }
      });

      jobs.push(function(done){
        campaign.updateAttributes({
          sentAt: new Date()
        }).then(function(){
          return done();
        }).catch(done);
      });

      async.series(jobs, callback);
    };

    api.campaigns.sendSimple = function(campaign, list, limit, offset, callback){
      var jobs = [];

      if(campaign.sentAt){ return callback(new Error('campaign already sent')); }
      if(campaign.sendAt - new Date().getTime() >= 0){ return callback(new Error('campaign should not be sent yet')); }

      api.models.listPerson.findAll({
        where: { listId: list.id },
        limit: limit,
        offset: offset
      }).then(function(listPeople){
        listPeople.forEach(function(listPerson){
          jobs.push(function(done){
            api.tasks.enqueue('campaigns:sendMessage', {
              listId: list.id,
              campaignId: campaign.id,
              listPersonId: listPerson.id,
            }, 'messagebot:campaigns', done);
          });
        });

        async.parallel(jobs, function(error){
          if(error){ return callback(error); }
          if(listPeople.length > 0){
            return api.campaigns.sendSimple(campaign, list, limit, (offset + listPeople.length), callback);
          }else{
            return callback(null, (offset + listPeople.length));
          }
        });
      }).catch(callback);
    };

    api.campaigns.sendRecurring = function(campaign, list, limit, offset, callback){
      throw new Error('not yet implemented');
    };

    api.campaigns.sendTrigger = function(campaign, list, limit, offset, callback){
      throw new Error('not yet implemented');
    };

    next();
  }
};
