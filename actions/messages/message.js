var async = require('async')

exports.messageCreate = {
  name: 'message:create',
  description: 'message:create',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    guid: { required: false },
    personGuid: { required: true },
    campaignId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    },
    transport: { required: true },
    body: { required: true },
    data: { required: false, default: {} },
    sentAt: { required: false },
    readAt: { required: false },
    actedAt: { required: false },
    createdAt: {
      required: false,
      formatter: function (p) {
        return new Date(parseInt(p))
      }
    }
  },

  run: function (api, data, next) {
    var message = api.models.Message.build(data.params)
    message.data = data.params.data
    message.teamId = data.team.id

    message.save().then(function () {
      data.response.message = message.apiData()
      next()
    }).catch(next)
  }
}

exports.messageEdit = {
  name: 'message:edit',
  description: 'message:edit',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    guid: { required: true },
    personGuid: { required: false },
    campaignId: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    },
    transport: { required: false },
    body: { required: false },
    data: { required: false },
    sentAt: { required: false },
    readAt: { required: false },
    actedAt: { required: false }
  },

  run: function (api, data, next) {
    api.models.Message.findOne({
      where: {
        teamId: data.team.id,
        guid: data.params.guid
      }
    }).then(function (message) {
      if (!message) { return next(new Error(`Message (${data.params.guid}) not found`)) }
      message.hydrate((error) => {
        if (error) { return next(error) }

        ['personGuid', 'campaignId', 'transport', 'body', 'sentAt', 'readAt', 'actedAt'].forEach((k) => {
          if (data.params[k]) { message[k] = data.params[k] }
        })

        if (data.params.data) {
          Object.keys(data.params.data).forEach(function (k) {
            message.data[k] = data.params.data[k]
          })
        }

        message.save().then(function () {
          data.response.message = message.apiData()
          next()
        }).catch(next)
        next()
      })
    }).catch(next)
  }
}

exports.messageView = {
  name: 'message:view',
  description: 'message:view',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    guid: { required: true }
  },

  run: function (api, data, next) {
    api.models.Message.findOne({
      where: {
        teamId: data.team.id,
        guid: data.params.guid
      }
    }).then(function (message) {
      if (!message) { return next(new Error(`Message (${data.params.guid}) not found`)) }
      message.hydrate((error) => {
        if (error) { return next(error) }
        data.response.message = message.apiData()
        next()
      })
    }).catch(next)
  }
}

exports.messageDelete = {
  name: 'message:delete',
  description: 'message:delete',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    guid: { required: true }
  },

  run: function (api, data, next) {
    api.models.Message.findOne({
      where: {
        teamId: data.team.id,
        guid: data.params.guid
      }
    }).then(function (message) {
      if (!message) { return next(new Error(`Message (${data.params.guid}) not found`)) }
      message.destroy().then(() => { next() }).catch(next)
    }).catch(next)
  }
}

exports.messageTrack = {
  name: 'message:track',
  description: 'message:track',
  outputExample: {},
  matchExtensionMimeType: true,
  middleware: ['require-team'],

  inputs: {
    guid: { required: true },
    ip: { required: false },
    link: { required: false },
    device: { required: false, default: 'message' },
    verb: {
      required: true,
      validator: function (p) {
        if (['read', 'act', 'test'].indexOf(p) < 0) {
          return 'verb not allowed'
        }
        return true
      }
    },
    lat: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    },
    lng: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    }
  },

  run: function (api, data, next) {
    var jobs = []
    var ip = data.params.ip
    var eventType
    var event
    var message

    // testing GUID or verb
    if (data.params.guid === '%%MESSAGEGUID%%' || data.params.verb === 'test') {
      if (data.params.link) {
        data.connection.rawConnection.responseHeaders.push(['Location', data.params.link])
        data.connection.rawConnection.responseHttpCode = 302
      } else if (data.connection.extension === 'gif') {
        data.toRender = false
        data.connection.rawConnection.responseHttpCode = 200
        data.connection.sendFile('tracking/tracking.gif')
      }
      return next()
    }

    if (!ip) { ip = data.connection.remoteIP }

    jobs.push(function (done) {
      api.models.Message.findOne({
        where: {
          teamId: data.team.id,
          guid: data.params.guid
        }
      }).then(function (m) {
        message = m
        if (!message) { return done(new Error(`Message (${data.params.guid}) not found`)) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      message.hydrate(done)
    })

    jobs.push(function (done) {
      if (data.params.verb === 'read') {
        message.readAt = new Date()
        eventType = 'message_read'
      }
      if (data.params.verb === 'act') {
        eventType = 'message_acted_on'
        message.actedAt = new Date()
      }
      done()
    })

    jobs.push(function (done) {
      message.save().then(() => { done() }).catch(done)
    })

    jobs.push(function (done) {
      event = api.models.Event.build({
        messageGuid: message.guid,
        personGuid: message.personGuid,
        type: eventType,
        ip: ip,
        device: data.params.device,
        teamId: data.team.id
      })

      event.data = {}
      if (data.params.link) { event.data.link = data.params.link }
      var location = api.geolocation.build(data.params, event.ip)
      if (location) { event.lat = location.lat; event.lng = location.lng }

      event.save().then(function () {
        data.response.event = event.apiData()
        done()
      }).catch(done)
    })

    async.series(jobs, function (error) {
      if (error) { return next(error) }

      if (data.params.link) {
        data.connection.rawConnection.responseHeaders.push(['Location', data.params.link])
        data.connection.rawConnection.responseHttpCode = 302
      } else if (data.connection.extension === 'gif') {
        data.toRender = false
        data.connection.rawConnection.responseHttpCode = 200
        data.connection.sendFile('tracking/tracking.gif')
      }

      api.tasks.enqueueIn(1, 'events:process', {
        teamId: data.team.id,
        events: [event.guid]
      }, 'messagebot:events', (e) => {
        next(e)
      })
    })
  }
}
