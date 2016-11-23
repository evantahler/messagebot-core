'use strict'

var async = require('async')

exports.task = {
  name: 'people:buildCreateEvent',
  description: 'people:buildCreateEvent',
  frequency: 0,
  queue: 'messagebot:people',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    var jobs = []
    var team
    var person
    var event

    jobs.push(function (done) {
      team = api.utils.determineActionsTeam({params: params})
      done()
    })

    jobs.push(function (done) {
      person = new api.models.Person(team, params.guid)
      person.hydrate(done)
    })

    jobs.push(function (done) {
      event = new api.models.Event(team)
      event.data.personGuid = person.data.guid
      event.data.type = 'person_created'
      event.data.ip = 'internal'
      event.data.device = person.data.device
      event.create(done)
    })

    jobs.push(function (done) {
      api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'events:process', {
        teamId: team.id,
        events: [event.data.guid]
      }, 'messagebot:events', done)
    })

    async.series(jobs, next)
  }
}
