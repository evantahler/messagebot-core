exports.eventCreate = {
  name: 'event:create',
  description: 'event:create',
  matchExtensionMimeType: true,
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    sync: { required: true, default: false },
    ip: { required: false },
    device: { required: true },
    guid: { required: false },
    personGuid: { required: true },
    messageGuid: { required: false },
    type: { required: true },
    data: { required: false, default: {} },
    lat: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    },
    lon: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    },
    createdAt: {
      required: false,
      formatter: function (p) {
        return new Date(parseInt(p))
      }
    }
  },

  run: function (api, data, next) {
    var event = new api.models.Event(data.team)
    event.data = data.params

    if (!event.data.ip) { event.data.ip = data.connection.remoteIP }
    event.data.location = api.geolocation.build(data.params, event.data.ip)

    // return without waiting for the crete callback; log errors
    // this effectivley allows the tracking request to 'buffer' in RAM & returning to the client quickly
    // guid will be hydrated syncrhonusly before the save operation
    if (data.params.sync === false) {
      event.create(function (error) {
        if (error) {
          api.log('event creation error: ' + error, 'error', data.params)
        } else {
          api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'events:process', {teamId: data.team.id, events: [event.guid]}, 'messagebot:events')
        }
      })
      data.response.guid = event.guid
      next()
    } else {
      event.create(function (error) {
        if (error) { return next(error) }
        data.response.guid = event.guid
        if (data.connection.extension === 'gif') {
          data.toRender = false
          data.connection.rawConnection.responseHttpCode = 200
          data.connection.sendFile('tracking/tracking.gif')
        }
        api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'events:process', {teamId: data.team.id, events: [event.guid]}, 'messagebot:events', next)
      })
    }
  }
}

exports.eventEdit = {
  name: 'event:edit',
  description: 'event:edit',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    ip: { required: false },
    device: { required: false },
    guid: { required: true },
    personGuid: { required: false },
    messageGuid: { required: false },
    type: { required: false },
    data: { required: false },
    lat: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    },
    lon: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    }
  },

  run: function (api, data, next) {
    var event = new api.models.Event(data.team, data.params.guid)
    event.data = data.params

    var newLocation = api.geolocation.build(data.params, event.data.ip)
    if (newLocation) { event.data.location = newLocation }

    event.edit(function (error) {
      if (error) { return next(error) }
      data.response.event = event.data
      api.tasks.enqueueIn(api.config.elasticsearch.cacheTime * 1, 'events:process', {teamId: data.team.id, events: [event.guid]}, 'messagebot:events', next)
    })
  }
}

exports.eventView = {
  name: 'event:view',
  description: 'event:view',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: true }
  },

  run: function (api, data, next) {
    var event = new api.models.Event(data.team, data.params.guid)

    event.hydrate(function (error) {
      if (error) { return next(error) }
      data.response.event = event.data
      next()
    })
  }
}

exports.eventDelete = {
  name: 'event:delete',
  description: 'event:delete',
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    guid: { required: true }
  },

  run: function (api, data, next) {
    var event = new api.models.Event(data.team, data.params.guid)

    event.hydrate(function (error) {
      if (error) { return next(error) }
      event.del(function (error) {
        if (error) { return next(error) }
        next()
      })
    })
  }
}
