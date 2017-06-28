

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
      api.models.Person.findOne({where: {
        teamId: team.id,
        guid: params.guid
      }}).then(function (p) {
        person = p
        if (!person) { return done(new Error('Person not found')) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      person.hydrate(done)
    })

    jobs.push(function (done) {
      event = api.models.Event.create({
        teamId: team.id,
        personGuid: person.guid,
        type: 'person_created',
        ip: 'internal',
        device: person.device
      }).then(function () {
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      api.tasks.enqueueIn(1, 'events:process', {
        teamId: team.id,
        events: [event.guid]
      }, 'messagebot:events', done)
    })

    async.series(jobs, next)
  }
}
