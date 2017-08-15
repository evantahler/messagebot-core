exports.settingsView = {
  name: 'settings:list',
  description: 'settings:list',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {},

  run: function (api, data, next) {
    data.response.team = data.team.apiData()

    api.models.Setting.findAll({
      where: { teamId: data.team.id },
      order: [['key', 'desc']]
    }).then((settings) => {
      data.response.settings = {}
      settings.forEach((setting) => {
        var d = setting.apiData()
        data.response.settings[d.key] = d
      })

      next()
    }).catch(next)
  }
}

exports.settingsEdit = {
  name: 'setting:edit',
  description: 'setting:edit',
  outputExample: {},
  middleware: ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    key: {required: true},
    value: {required: true}
  },

  run: function (api, data, next) {
    api.models.Setting.findOne({
      where: {
        teamId: data.team.id,
        key: data.params.key
      }
    }).then((setting) => {
      if (!setting) { return next(new Error('Setting not found')) }
      setting.updateAttributes({
        value: data.params.value
      }).then(() => {
        data.response.setting = setting.apiData()
        next()
      }).catch(next)
    }).catch(next)
  }
}
