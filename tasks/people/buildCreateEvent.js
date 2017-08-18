const async = require('async')

exports.task = {
  name: 'people:buildCreateEvent',
  description: 'people:buildCreateEvent',
  frequency: 0,
  queue: 'messagebot:people',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    let jobs = []
    let team
    let person
    let event

    jobs.push((done) => {
      api.utils.determineActionsTeam({params: params}, (error, _team) => {
        team = _team
        done(error)
      })
    })

    jobs.push((done) => {
      api.models.Person.findOne({where: {
        teamGuid: team.guid,
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
        teamGuid: team.guid,
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
        teamGuid: team.guid,
        events: [event.guid]
      }, 'messagebot:events', done)
    })

    async.series(jobs, (error) => {
      next(error)
    })
  }
}
