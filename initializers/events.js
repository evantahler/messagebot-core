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
        var jobs = []

        api.models.Campaign.findAll({
          where: {
            teamId: team.id,
            type: 'trigger'
          }
        }).then((campaigns) => {
          campaigns.forEach((campaign) => {
            var matched = true

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
                var delay = 1
                if (campaign.triggerDelay) { delay = campaign.triggerDelay * 1000 }
                api.tasks.enqueueIn(delay, 'campaigns:triggerEventCheck', {
                  teamId: team.id,
                  eventGuid: event.guid,
                  personGuid: event.personGuid,
                  campaignId: campaign.id,
                  listId: campaign.listId,
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
          teamId: team.id,
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
