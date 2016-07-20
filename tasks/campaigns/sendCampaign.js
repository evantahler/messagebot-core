'use strict';

exports.task = {
  name:          'campaigns:sendCampaign',
  description:   'campaigns:sendCampaign',
  frequency:     0,
  queue:         'messagebot:campaigns',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    api.models.campaign.find({where:{id: params.campaignId}}).then(function(campaign){
      campaign.send(next);
    }).catch(next);
  }
};
