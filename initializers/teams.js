

var async = require('async')

module.exports = {
  loadPriority: 1000,

  initialize: function (api, next) {
    api.teams = {
      teams: [],
      settings: [],

      load: function (callback) {
        var jobs = []
        if (api.running) {
          api.models.Team.findAll().then(function (teams) {
            api.teams.teams = teams

            teams.forEach(function (team) {
              jobs.push(function (done) {
                api.teams.ensureSettings(team, done)
              })
            })

            async.series(jobs, function (error) {
              process.nextTick(function () {
                if (error) { return callback(error) }
                api.log('loaded ' + teams.length + ' teams into memory')
                return callback()
              })
            })
          })
        } else {
          return callback()
        }
      },

      ensureSettings: function (team, callback) {
        var jobs = []
        api.models.Setting.findAll({where: {teamId: team.id}}).then(function (settings) {
          api.teams.settings.forEach(function (settingParent) {
            var found = false
            settings.forEach(function (s) {
              if (s.key === settingParent.key) { found = true }
            })

            if (found === false) {
              jobs.push(function (done) {
                api.models.Setting.create({
                  teamId: team.id,
                  key: settingParent.key,
                  value: settingParent.value,
                  description: settingParent.description
                }).then(function () {
                  api.log(`[Team ${team.id}] set default setting for \`${settingParent.key}\` to \`${settingParent.value}\``)
                  done()
                }).catch(function (error) {
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
      }
    }

    next()
  },

  start: function (api, next) {
    api.teams.load(next)
  }
}
