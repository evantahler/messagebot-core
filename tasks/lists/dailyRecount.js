const async = require('async')

exports.task = {
  name: 'lists:dailyRecount',
  description: 'lists:dailyRecount',
  frequency: (1000 * 60 * 60 * 24),
  queue: 'messagebot:lists',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    let jobs = []

    api.models.List.findAll().then((lists) => {
      lists.forEach((list) => {
        jobs.push((done) => {
          api.tasks.enqueue('lists:peopleCount', {listGuid: list.guid}, 'messagebot:lists', done)
        })
      })

      async.series(jobs, (error) => {
        return next(error)
      })
    }).catch(next)
  }
}
