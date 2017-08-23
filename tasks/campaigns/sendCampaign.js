
exports.task = {
  name: 'campaigns:sendCampaign',
  description: 'campaigns:sendCampaign',
  frequency: 0,
  queue: 'messagebot:campaigns',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    api.models.Campaign.find({where: {guid: params.campaignGuid}}).then((campaign) => {
      campaign.send((error) => { next(error) })
    }).catch(next)
  }
}
