
var async = require('async')

exports.task = {
  name: 'campaigns:triggerEventCheck',
  description: 'campaigns:triggerEventCheck',
  frequency: 0,
  queue: 'messagebot:campaigns',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    var jobs = []
    var toSend = false
    var list

    jobs.push((done) => {
      api.models.List.findOne({
        where: {id: params.listId}
      }).then((_list) => {
        if (!_list) { return done(new Error(`List (${params.listId}) not found`)) }
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
        teamId: params.teamId,
        personGuid: params.personGuid,
        listId: params.listId
      }}).then((listPerson) => {
        if (listPerson) { toSend = true }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      if (toSend === true) {
        api.tasks.enqueue('campaigns:sendMessage', {
          listId: params.listId,
          campaignId: params.campaignId,
          personGuid: params.personGuid
        }, 'messagebot:campaigns', done)
      } else { done() }
    })

    async.series(jobs, next)
  }
}
