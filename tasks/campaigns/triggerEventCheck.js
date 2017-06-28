

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

    jobs.push(function (done) {
      api.models.List.findOne({
        where: {id: params.listId}
      }).then(function (_list) {
        if (!_list) { return done(new Error('list not found')) }
        list = _list
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      if (!list.peopleCountedAt || list.peopleCountedAt.getTime() < params.enqueuedAt) {
        list.associateListPeople(done)
      } else {
        done()
      }
    })

    jobs.push(function (done) {
      api.models.ListPerson.findOne({where: {
        teamId: params.teamId,
        personGuid: params.personGuid,
        listId: params.listId
      }}).then(function (listPerson) {
        if (listPerson) { toSend = true }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      if (toSend === true) {
        api.tasks.enqueue('campaigns:sendMessage', {
          listId: params.listId,
          campaignId: params.campaignId,
          personGuid: params.personGuid
        }, 'messagebot:campaigns', done)
      } else { done() }
    })

    async.series(jobs, function (error) {
      process.nextTick(function () { return next(error) })
    })
  }
}
