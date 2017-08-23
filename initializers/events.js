const async = require('async')
const TopLevelEventProps = [
  'type',
  'ip',
  'device',
  'personGuid',
  'messageGuid',
  'lat',
  'lng'
]

module.exports = {
  initialize: function (api, next) {
    api.events = {
      triggerCampaigns: function (team, event, callback) {
        let jobs = []

        api.models.Campaign.findAll({
          where: {
            teamGuid: team.guid,
            type: 'trigger'
          }
        }).then((campaigns) => {
          campaigns.forEach((campaign) => {
            let matched = true

            if (!campaign.triggerEventMatch || Object.keys(campaign.triggerEventMatch) === 0) { matched = false }
            if (!campaign.sendAt) { matched = false }
            if (campaign.sendAt > new Date()) { matched = false }

            Object.keys(campaign.triggerEventMatch).forEach((k) => {
              let regexp = new RegExp(campaign.triggerEventMatch[k])
              let v = event.data[k]
              if (TopLevelEventProps.indexOf(k) >= 0) { v = event[k] }
              if (v === null || v === undefined) { matched = false }
              if (!v.match(regexp)) { matched = false }
            })

            if (matched === true) {
              jobs.push((done) => {
                let delay = 1
                if (campaign.triggerDelay) { delay = campaign.triggerDelay * 1000 }
                api.tasks.enqueueIn(delay, 'campaigns:triggerEventCheck', {
                  teamGuid: team.guid,
                  eventGuid: event.guid,
                  personGuid: event.personGuid,
                  campaignGuid: campaign.guid,
                  listGuid: campaign.listGuid,
                  enqueuedAt: new Date().getTime()
                }, 'messagebot:campaigns', done)
              })
            }
          })

          async.series(jobs, callback)
        }).catch(callback)
      },

      propigateLocationToPerson: function (team, event, callback) {
        if (!event.lat || !event.lng) { return callback() }

        api.models.Person.findOne({where: {
          teamGuid: team.guid,
          guid: event.personGuid
        }}).then((person) => {
          if (!person) { return callback(new Error(`Person (${event.personGuid}) not found`)) }

          if (event.device !== 'message') {
            person.device = event.device
          }

          person.lat = event.lat
          person.lng = event.lng

          person.save().then(() => {
            callback()
          }).catch(callback)
        }).catch(callback)
      }
    }

    next()
  }
}
