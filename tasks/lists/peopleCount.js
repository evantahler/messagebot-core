
exports.task = {
  name: 'lists:peopleCount',
  description: 'lists:peopleCount',
  frequency: 0,
  queue: 'messagebot:lists',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    api.models.List.findOne({
      where: {id: params.listId}
    }).then(function (list) {
      if (!list) { return next(new Error('list not found')) }
      list.associateListPeople(next)
    }).catch(next)
  }
}
