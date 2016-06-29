'use strict';

exports.task = {
  name:          'campaigns:sendCampaign',
  description:   'campaigns:sendCampaign',
  frequency:     0,
  queue:         'messagebot:campaigns',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    api.campaigns.send(params.campaignId, function(error){
      next(error);
    });
  }
};
