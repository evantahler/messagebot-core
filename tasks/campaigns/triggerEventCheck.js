const async = require('async')

exports.task = {
  name: 'campaigns:triggerEventCheck',
  description: 'campaigns:triggerEventCheck',
  frequency: 0,
  queue: 'messagebot:campaigns',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    let jobs = []
    let toSend = false
    let list

    jobs.push((done) => {
      api.models.List.findOne({
        where: {guid: params.listGuid}
      }).then((_list) => {
        if (!_list) { return done(new Error(`List (${params.listGuid}) not found`)) }
        list = _list
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      if (!list.peopleCountedAt || list.peopleCountedAt.getTime() < params.enqueuedAt) {
        list.associateListPeople(done)
      } else {
        done()
      }
    })

    jobs.push((done) => {
      api.models.ListPerson.findOne({where: {
        teamGuid: params.teamGuid,
        personGuid: params.personGuid,
        listGuid: params.listGuid
      }}).then((listPerson) => {
        if (listPerson) { toSend = true }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      if (toSend === true) {
        api.tasks.enqueue('campaigns:sendMessage', {
          listGuid: params.listGuid,
          campaignGuid: params.campaignGuid,
          personGuid: params.personGuid
        }, 'messagebot:campaigns', done)
      } else { done() }
    })

    async.series(jobs, next)
  }
}
