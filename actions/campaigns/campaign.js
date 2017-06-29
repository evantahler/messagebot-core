var transportValidator = function (p) {
  var api = this
  var transportNames = []

  api.transports.forEach(function (t) { transportNames.push(t.name) })
  if (transportNames.indexOf(p) < 0) {
    return new Error(p + ' is not a valid transport')
  } else {
    return true
  }
}

exports.campaignCreate = {
  name: 'campaign:create',
  description: 'campaign:create',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    description: { required: true },
    listId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    },
    templateId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    },
    folder: {
      required: false,
      defualt: function () { return 'default' }
    },
    type: { required: true },
    transport: {
      required: true,
      validator: transportValidator
    },
    campaignVariables: {
      required: false,
      formatter: function (p) { return JSON.parse(p) }
    },
    triggerEventMatch: {
      required: false,
      formatter: function (p) { return JSON.parse(p) }
    },
    sendAt: {
      required: false,
      formatter: function (p) { return new Date(parseInt(p)) }
    },
    triggerDelay: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    },
    reSendDelay: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    var campaign = api.models.Campaign.build(data.params)
    campaign.teamId = data.session.teamId

    campaign.save().then(function () {
      data.response.campaign = campaign.apiData()
      next()
    }).catch(function (errors) {
      next(errors.errors[0].message)
    })
  }
}

exports.campaignView = {
  name: 'campaign:view',
  description: 'campaign:view',
  outputExample: {},
  middleware: ['logged-in-session'],

  inputs: {
    campaignId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId
    }}).then(function (campaign) {
      if (!campaign) { return next(new Error('campaign not found')) }
      data.response.campaign = campaign.apiData()
      next()
    }).catch(next)
  }
}

exports.campaignCopy = {
  name: 'campaign:copy',
  description: 'campaign:copy',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    campaignId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId
    }}).then(function (campaign) {
      if (!campaign) { return next(new Error('campaign not found')) }
      var newCampaign = api.models.Campaign.build({
        name: data.params.name,
        description: campaign.description,
        folder: campaign.folder,
        type: campaign.type,
        listId: campaign.listId,
        teamId: campaign.teamId,
        templateId: campaign.templateId,
        transport: campaign.transport,
        campaignVariables: campaign.campaignVariables,
        triggerEventMatch: campaign.triggerEventMatch
        // sendAt:            campaign.sendAt,
        // triggerDelay:      campaign.triggerDelay,
        // reSendDelay:       campaign.reSendDelay,

      })
      newCampaign.save().then(function () {
        data.response.campaign = newCampaign.apiData()
        next()
      }).catch(function (errors) {
        next(errors.errors[0].message)
      })
    }).catch(next)
  }
}

exports.campaignEdit = {
  name: 'campaign:edit',
  description: 'campaign:edit',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: false },
    description: { required: false },
    listId: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    },
    templateId: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    },
    folder: {
      required: false,
      defualt: function () { return 'default' }
    },
    type: { required: false },
    transport: {
      required: false,
      validator: transportValidator
    },
    campaignVariables: {
      required: false,
      formatter: function (p) { return JSON.parse(p) }
    },
    triggerEventMatch: {
      required: false,
      formatter: function (p) { return JSON.parse(p) }
    },
    sendAt: {
      required: false,
      formatter: function (p) { return new Date(parseInt(p)) }
    },
    triggerDelay: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    },
    reSendDelay: {
      required: false,
      formatter: function (p) { return parseInt(p) }
    },
    campaignId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId
    }}).then(function (campaign) {
      if (!campaign) { return next(new Error('campaign not found')) }

      campaign.updateAttributes(data.params).then(function () {
        data.response.campaign = campaign.apiData()
        next()
      }).catch(next)
    }).catch(next)
  }
}

exports.campaignStats = {
  name: 'campaign:stats',
  description: 'campaign:stats',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin', 'require-team'],

  inputs: {
    campaignId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    },
    start: {
      required: false,
      formatter: function (p) { return new Date(parseInt(p)) },
      default: function (p) { return 0 }
    },
    end: {
      required: false,
      formatter: function (p) { return new Date(parseInt(p)) },
      default: function (p) { return new Date().getTime() }
    },
    interval: {
      required: true,
      default: 'date'
    }
  },
  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.team.id
    }}).then(function (campaign) {
      if (!campaign) { return next(new Error('campaign not found')) }

      campaign.stats(data.params.start, data.params.end, data.params.interval, function (error, terms, totals) {
        if (error) { return next(error) }
        data.response.totals = totals
        Object.keys(terms).forEach(function (term) {
          data.response[term] = terms[term]
        })
        next(error)
      })
    }).catch(next)
  }
}

exports.campaignDelete = {
  name: 'campaign:delete',
  description: 'campaign:delete',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    campaignId: {
      required: true,
      formatter: function (p) { return parseInt(p) }
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      id: data.params.campaignId,
      teamId: data.session.teamId
    }}).then(function (campaign) {
      if (!campaign) { return next(new Error('campaign not found')) }
      campaign.destroy().then(function () {
        next()
      })
    }).catch(next)
  }
}
