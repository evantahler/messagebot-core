var async = require('async')

module.exports = {
  initialize: function (api, next) {
    api.events = {
      triggerCampaign: function (team, event, callback) {
        var jobs = []

        api.models.Campaign.findAll({
          where: {
            teamId: team.id,
            type: 'trigger'
          }
        }).then((campaigns) => {
          campaigns.forEach(function (campaign) {
            var matched = true

            Object.keys(campaign.triggerEventMatch).forEach(function (k) {
              if (k !== 'data') {
                if (!event[k]) {
                  matched = false
                } else {
                  var regexp = new RegExp(campaign.triggerEventMatch[k])
                  if (!event[k].match(regexp)) { matched = false }
                }
              }
            })

            if (campaign.triggerEventMatch.data) {
              Object.keys(campaign.triggerEventMatch.data).forEach(function (k) {
                if (!event.data[k]) {
                  matched = false
                } else {
                  var regexp = new RegExp(campaign.triggerEventMatch.data[k])
                  if (!event.data[k].match(regexp)) { matched = false }
                }
              })
            }

            if (matched === true) {
              jobs.push(function (done) {
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
        if (!event.lat && !event.lng) { return callback() }

        api.models.Person.findOne({where: {
          teamId: team.id,
          guid: event.personGuid
        }}).then((person) => {
          person.hydrate((error) => {
            if (error) { return callback(error) }

            if (event.device !== 'message') {
              person.device = event.device
            }

            person.lat = event.lat
            person.lng = event.lng

            person.save().then(() => { callback() }).catch(callback)
          })
        }).catch(callback)
      }
    }

    next()
  }
}
