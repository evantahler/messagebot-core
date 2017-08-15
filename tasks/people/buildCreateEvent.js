
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

    jobs.push((done) => {
      api.utils.determineActionsTeam({params: params}, (error, _team) => {
        team = _team
        done(error)
      })
    })

    jobs.push((done) => {
      api.models.Person.findOne({where: {
        teamId: team.id,
        guid: params.guid
      }}).then((p) => {
        person = p
        if (!person) { return done(new Error('Person not found')) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      person.hydrate(done)
    })

    jobs.push((done) => {
      event = api.models.Event.build({
        teamId: team.id,
        personGuid: person.guid,
        type: 'person_created',
        ip: 'internal',
        device: person.device
      })

      event.save().then(() => {
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.tasks.enqueueIn(1, 'events:process', {
        teamId: team.id,
        events: [event.guid]
      }, 'messagebot:events', done)
    })

    async.series(jobs, (error) => {
      next(error)
    })
  }
}
