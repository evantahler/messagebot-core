const async = require('async')

module.exports = {
  loadPriority: 1000,

  initialize: function (api, next) {
    api.teams = {
      settings: [],

      ensureSettings: function (team, callback) {
        let jobs = []
        api.models.Setting.findAll({where: {teamGuid: team.guid}}).then((settings) => {
          api.teams.settings.forEach((settingParent) => {
            let found = false
            settings.forEach((s) => {
              if (s.key === settingParent.key) { found = true }
            })

            if (found === false) {
              jobs.push((done) => {
                api.models.Setting.create({
                  teamGuid: team.guid,
                  key: settingParent.key,
                  value: settingParent.value,
                  description: settingParent.description
                }).then(() => {
                  api.log(`[Team ${team.guid}] set default setting for \`${settingParent.key}\` to \`${settingParent.value}\``)
                  done()
                }).catch((error) => {
                  // another instance created the setting for us; it's OK.
                  if (error.toString().match(/SequelizeUniqueConstraintError/)) {
                    return done()
                  } else {
                    return done(error)
                  }
                })
              })
            }
          })

          async.series(jobs, callback)
        }).catch(callback)
      },

      ensureSettingsPrommise: function (team) {
        return new Promise((resolve, reject) => {
          api.teams.ensureSettings(team, (error) => {
            if (error) { return reject(error) }
            resolve()
          })
        })
      }
    }

    next()
  }
}
