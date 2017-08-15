exports.eventCreate = {
  name: 'event:create',
  description: 'event:create',
  matchExtensionMimeType: true,
  outputExample: {},
  middleware: ['require-team'],

  inputs: {
    guid: { required: false },
    teamId: { required: false, formatter: function (p) { return parseInt(p) } },
    ip: { required: false },
    device: { required: true },
    personGuid: { required: true },
    messageGuid: { required: false },
    type: { required: true },
    data: { required: false, default: {} },
    lat: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    },
    lng: {
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
    let event = api.models.Event.build(data.params)
    if (!event.teamId) { event.teamId = data.team.id }
    event.data = data.params.data

    if (!event.ip) { event.ip = data.connection.remoteIP }
    let location = api.geolocation.build(data.params, event.ip)
    if (location) { event.lat = location.lat; event.lng = location.lng }

    event.save().then(() => {
      data.response.event = event.apiData()
      if (data.connection.extension === 'gif') {
        data.toRender = false
        data.connection.rawConnection.responseHttpCode = 200
        data.connection.sendFile('tracking/tracking.gif')
      }

      api.tasks.enqueueIn(1, 'events:process', {teamId: data.team.id, events: [event.guid]}, 'messagebot:events', next)
    }).catch(next)
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
    lng: {
      required: false,
      formatter: function (p) { return parseFloat(p) }
    }
  },

  run: function (api, data, next) {
    api.models.Event.findOne({where: {
      teamId: data.team.id,
      guid: data.params.guid
    }}).then((event) => {
      if (!event) { return next(new Error(`Event (${data.params.guid}) not found`)) }
      event.hydrate((error) => {
        if (error) { return next(error) }

        ['ip', 'device', 'personGuid', 'messageGuid', 'type', 'lat', 'lng'].forEach((k) => {
          if (data.params[k]) { event[k] = data.params[k] }
        })

        if (data.params.data) {
          Object.keys(data.params.data).forEach((k) => {
            event.data[k] = data.params.data[k]
          })
        }

        event.save().then(() => {
          data.response.event = event.apiData()
          api.tasks.enqueueIn(1, 'events:process', {teamId: data.team.id, events: [event.guid]}, 'messagebot:events', next)
        }).catch(next)
      })
    }).catch(next)
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
    api.models.Event.findOne({where: {
      teamId: data.team.id,
      guid: data.params.guid
    }}).then((event) => {
      if (!event) { return next(new Error(`Event (${data.params.guid}) not found`)) }
      event.hydrate((error) => {
        if (error) { return next(error) }
        data.response.event = event.apiData()
        next()
      })
    }).catch(next)
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
    api.models.Event.findOne({where: {
      teamId: data.team.id,
      guid: data.params.guid
    }}).then((event) => {
      if (!event) { return next(new Error(`Event (${data.params.guid}) not found`)) }
      event.destroy().then(() => { next() }).catch(next)
    }).catch(next)
  }
}
