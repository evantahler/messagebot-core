'use strict';
var async  = require('async');

module.exports = {
  initialize: function(api, next){
    api.campaigns = {
      triggerd: {},

      loadTriggered: function(callback){
        var jobs = [];
        if(api.running){
          api.models.campaign.findAll({
            where: {
              type: 'trigger',
            }
          }).then(function(campaigns){
            api.campaigns.triggerd = {};
            campaigns.forEach(function(campaign){
              if(!api.campaigns.triggerd[campaign.teamId]){ api.campaigns.triggerd[campaign.teamId] = []; }
              api.campaigns.triggerd[campaign.teamId].push(campaign);
            });

            api.log('loaded ' + campaigns.length + ' triggered campaigns into memory');
            return callback();
          });
        }else{
          return callback();
        }
      }
    };

    next();
  },

  start: function(api, next){
    api.campaigns.loadTriggered(next);
  },
};
