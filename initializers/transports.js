

module.exports = {
  loadPriority: 900,

  initialize: function (api, next) {
    api.transports = []
    next()
  }
}
