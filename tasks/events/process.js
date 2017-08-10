var async = require('async')

exports.task = {
  name: 'events:process',
  description: 'events:process',
  frequency: 0,
  queue: 'messagebot:events',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    var loadJobs = []
    var workJobs = []
    var events = []

    api.utils.determineActionsTeam({params: params}, (error, team) => {
      if (error) { return next(error) }

      params.events.forEach((eventGuid) => {
        loadJobs.push((done) => {
          api.models.Event.findOne({where: {guid: eventGuid}}).then((event) => {
            if (!event) { return done(new Error(`Message (${eventGuid}) not found`)) }
            event.hydrate((error) => {
              if (error) { return done(error) }
              events.push(event)
              done()
            })
          }).catch(done)
        })
      })

      loadJobs.push((done) => {
        events.forEach((event) => {
          workJobs.push((workDone) => {
            api.events.triggerCampaigns(team, event, workDone)
          })

          workJobs.push((workDone) => {
            api.events.propigateLocationToPerson(team, event, workDone)
          })
        })
        done()
      })

      loadJobs.push((done) => { async.series(workJobs, done) })
      async.series(loadJobs, (error) => { next(error) })
    })
  }
}
