const async = require('async')

exports.task = {
  name: 'campaigns:checkCampaignsToSend',
  description: 'campaigns:checkCampaignsToSend',
  frequency: (1000 * 60),
  queue: 'messagebot:campaigns',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    let searchJobs = []
    let campaignJobs = []
    let campaigns = []

    searchJobs.push((done) => {
      api.models.Campaign.findAll({
        where: {
          type: 'simple',
          sendAt: {$lte: new Date()},
          sendingAt: {$eq: null},
          sentAt: {$eq: null}
        }
      }).then((_campaigns) => {
        _campaigns.forEach((campaign) => { campaigns.push(campaign) })
        done()
      }).catch(done)
    })

    searchJobs.push((done) => {
      api.models.Campaign.findAll({
        where: {
          type: 'recurring',
          sendAt: { $lte: new Date() },
          reSendDelay: { $ne: null }
        }
      }).then((_campaigns) => {
        _campaigns.forEach((campaign) => {
          let now = new Date().getTime()
          if (!campaign.sentAt || (campaign.sentAt.getTime() + (1000 * campaign.reSendDelay)) < now) {
            campaigns.push(campaign)
          }
        })

        done()
      }).catch(done)
    })

    searchJobs.push((done) => {
      campaigns.forEach((campaign) => {
        campaignJobs.push((more) => {
          api.tasks.enqueue('campaigns:sendCampaign', {
            campaignId: campaign.id
          }, 'messagebot:campaigns', more)
        })
      })

      async.series(campaignJobs, done)
    })

    async.series(searchJobs, (error) => {
      let campaignIds = []
      campaigns.forEach((campaign) => { campaignIds.push(campaign.id) })
      return next(error, campaignIds)
    })
  }
}
