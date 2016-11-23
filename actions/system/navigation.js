exports.documentation = {
  name: 'system:navigation',
  description: 'return the defintion for the ui navigation',
  outputExample: {},

  run: function (api, data, next) {
    data.response.navigation = api.navigation.navigation
    next()
  }
}
