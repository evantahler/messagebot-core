const async = require('async')

exports.messageCreate = {
  name: 'message:create',
  description: 'message:create',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    guid: { required: false },
    personGuid: { required: true },
    campaignGuid: {
      required: true
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
    let message = api.models.Message.build(data.params)
    message.data = data.params.data
    message.teamGuid = data.team.guid

    message.save().then(() => {
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
    campaignGuid: {
      required: false
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
        teamGuid: data.team.guid,
        guid: data.params.guid
      }
    }).then((message) => {
      if (!message) { return next(new Error(`Message (${data.params.guid}) not found`)) }
      message.hydrate((error) => {
        if (error) { return next(error) }

        ['personGuid', 'campaignGuid', 'transport', 'body', 'sentAt', 'readAt', 'actedAt'].forEach((k) => {
          if (data.params[k]) { message[k] = data.params[k] }
        })

        if (data.params.data) {
          Object.keys(data.params.data).forEach((k) => {
            message.data[k] = data.params.data[k]
          })
        }

        message.save().then(() => {
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
        teamGuid: data.team.guid,
        guid: data.params.guid
      }
    }).then((message) => {
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
        teamGuid: data.team.guid,
        guid: data.params.guid
      }
    }).then((message) => {
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
    let jobs = []
    let ip = data.params.ip
    let eventType
    let event
    let message

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

    jobs.push((done) => {
      api.models.Message.findOne({
        where: {
          teamGuid: data.team.guid,
          guid: data.params.guid
        }
      }).then((m) => {
        message = m
        if (!message) { return done(new Error(`Message (${data.params.guid}) not found`)) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      message.hydrate(done)
    })

    jobs.push((done) => {
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

    jobs.push((done) => {
      message.save().then(() => { done() }).catch(done)
    })

    jobs.push((done) => {
      event = api.models.Event.build({
        messageGuid: message.guid,
        personGuid: message.personGuid,
        type: eventType,
        ip: ip,
        device: data.params.device,
        teamGuid: data.team.guid
      })

      event.data = {}
      if (data.params.link) { event.data.link = data.params.link }
      let location = api.geolocation.build(data.params, event.ip)
      if (location) { event.lat = location.lat; event.lng = location.lng }

      event.save().then(() => {
        data.response.event = event.apiData()
        done()
      }).catch(done)
    })

    async.series(jobs, (error) => {
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
        teamGuid: data.team.guid,
        events: [event.guid]
      }, 'messagebot:events', (e) => {
        next(e)
      })
    })
  }
}
