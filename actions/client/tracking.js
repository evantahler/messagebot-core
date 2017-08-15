const async = require('async')
const fs = require('fs')
const path = require('path')

let prepareFile = function (api, data, file, mime, next) {
  let jobs = []
  let settings = {}
  let source = ''

  jobs.push((done) => {
    api.models.Setting.findAll({where: {teamId: data.team.id}}).then((_settings) => {
      settings = _settings
      done()
    }).catch(done)
  })

  jobs.push((done) => {
    fs.readFile(file, (error, _source) => {
      if (error) { return done(error) }
      source = _source.toString()
      done()
    })
  })

  jobs.push((done) => {
    source = source.replace(/%%TRACKINGDOMAIN%%/g, data.team.trackingDomain)
    source = source.replace(/%%TEAMID%%/g, data.team.id)
    source = source.replace(/%%APIROUTE%%/g, api.config.servers.web.urlPathForActions)
    done()
  })

  jobs.push((done) => {
    let settingJobs = []
    settings.forEach((setting) => {
      settingJobs.push((settingsDone) => {
        let key = setting.key.toUpperCase()
        let regexp = new RegExp('%%' + key + '%%', 'g')
        source = source.replace(regexp, setting.value)
        settingsDone()
      })
    })
    async.series(settingJobs, done)
  })

  jobs.push((done) => {
    data.response = source
    data.connection.rawConnection.responseHeaders.push(['Content-type', mime])
    done()
  })

  async.series(jobs, next)
}

exports.client = {
  name: 'tracking:client',
  description: 'tracking:client',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } }
  },

  run: function (api, data, next) {
    let file = path.join(__dirname, '/../../client/web.js')
    prepareFile(api, data, file, 'application/javascript', next)
  }
}

exports.subscriptions = {
  name: 'tracking:subscriptions',
  description: 'tracking:subscriptions',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } }
  },

  run: function (api, data, next) {
    let file = path.join(__dirname, '/../../client/subscriptions.html')
    prepareFile(api, data, file, 'text/html', next)
  }
}
