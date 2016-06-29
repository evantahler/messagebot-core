'use strict';

var async = require('async');

exports.task = {
  name:          'campaigns:checkCampaignsToSend',
  description:   'campaigns:checkCampaignsToSend',
  frequency:     (1000 * 60),
  queue:         'messagebot:campaigns',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var searchJobs = [];
    var campaignJobs = [];
    var campaigns = [];

    searchJobs.push(function(done){
      api.models.campaign.findAll({
        where:{
          type:      'simple',
          sendAt:    {$lte: new Date()},
          sendingAt: {$eq: null},
          sentAt:    {$eq: null},
        }
      }).then(function(camps){
        camps.forEach(function(campaign){ campaigns.push(campaign); })
        done();
      }).catch(done)
    })

    //TODO: Other types of campaigns

    searchJobs.push(function(done){
      campaigns.forEach(function(campaign){
        campaignJobs.push(function(more){
          api.tasks.enqueue('campaigns:sendCampaign', {
            campaignId: campaign.id,
          }, 'messagebot:campaigns', more);
        });
      })

      async.series(campaignJobs, done);
    });

    async.series(searchJobs, function(error){
      var campaignIds = [];
      campaigns.forEach(function(campaign){ campaignIds.push(campaign.id); })
      next(error, campaignIds);
    });
  }
};
