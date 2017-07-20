
var async = require('async')
var exec = require('child_process').exec

module.exports = {
  initialize: function (api, next) {
    api.utils.findInBatches = function (model, query, recordResponder, callback, limit, offset) {
      if (!limit) { limit = 1000 }
      if (!offset) { offset = 0 }

      query.limit = limit
      query.offset = offset
      model.findAll(query).then(function (records) {
        var jobs = []
        if (!records || records.length === 0) { return callback() }
        records.forEach(function (r) {
          jobs.push(function (done) { recordResponder(r, done) })
        })

        async.series(jobs, function (error) {
          process.nextTick(function () {
            if (error) { return callback(error) }
            api.utils.findInBatches(model, query, recordResponder, callback, limit, (offset + limit))
          })
        })
      }).catch(callback)
    }

    api.utils.determineActionsTeam = function (data, callback) {
      var team

      api.models.Team.findAll().then((teams) => {
        // leave this as an option for explicit tasks/internal use
        // no action should have this allowed as a param
        if (!team && data.params && data.params.teamId) {
          teams.forEach(function (_team) {
            if (_team.id === data.params.teamId) { team = _team }
          })
        }

        if (!team && data.session && data.session.teamId) {
          teams.forEach(function (_team) {
            if (_team.id === data.session.teamId) { team = _team }
          })
        }

        if (!team && data.connection && data.connection.type === 'web') {
          teams.forEach(function (_team) {
            var regexp = new RegExp(_team.trackingDomainRegexp)
            if (data.connection.rawConnection.req.headers.host.match(regexp)) { team = _team }
          })
        }

        return callback(null, team)
      }).catch(callback)
    }

    api.utils.doShell = function (commands, callback, silent) {
      if (!silent) { silent = false }
      if (!Array.isArray(commands)) { commands = [commands] }
      // var fullCommand = '/bin/sh -c \'' + commands.join(' && ') + '\''
      var fullCommand = commands.join(' && ')
      if (!silent) { console.log('>> ' + fullCommand) }
      exec(fullCommand, function (error, stdout, stderr) {
        if (stderr) { error = stderr }
        callback(error, stdout, stderr)
      })
    }

    next()
  }
}
