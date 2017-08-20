const async = require('async')

let transportValidator = function (p) {
  let api = this
  let transportNames = []

  api.transports.forEach((t) => { transportNames.push(t.name) })
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
    listGuid: {
      required: true
    },
    templateGuid: {
      required: true
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
    let campaign = api.models.Campaign.build(data.params)
    campaign.teamGuid = data.session.teamGuid

    campaign.save().then(() => {
      data.response.campaign = campaign.apiData()
      next()
    }).catch((errors) => {
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
    campaignGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    let jobs = []

    jobs.push((done) => {
      api.models.Campaign.findOne({where: {
        guid: data.params.campaignGuid,
        teamGuid: data.session.teamGuid
      }}).then((campaign) => {
        if (!campaign) { return done(new Error('campaign not found')) }
        data.response.campaign = campaign.apiData()
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.Message.findOne({where: {
        campaignGuid: data.params.campaignGuid
      }}).then((message) => {
        if (message) {
          data.response.sampleMessage = message.apiData()
        }
        done()
      }).catch(done)
    })

    async.series(jobs, next)
  }
}

exports.campaignCopy = {
  name: 'campaign:copy',
  description: 'campaign:copy',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    campaignGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      guid: data.params.campaignGuid,
      teamGuid: data.session.teamGuid
    }}).then((campaign) => {
      if (!campaign) { return next(new Error('campaign not found')) }
      let newCampaign = api.models.Campaign.build({
        name: data.params.name,
        description: campaign.description,
        folder: campaign.folder,
        type: campaign.type,
        listGuid: campaign.listGuid,
        teamGuid: campaign.teamGuid,
        templateGuid: campaign.templateGuid,
        transport: campaign.transport,
        campaignVariables: campaign.campaignVariables,
        triggerEventMatch: campaign.triggerEventMatch
        // sendAt:            campaign.sendAt,
        // triggerDelay:      campaign.triggerDelay,
        // reSendDelay:       campaign.reSendDelay,

      })
      newCampaign.save().then(() => {
        data.response.campaign = newCampaign.apiData()
        next()
      }).catch((errors) => {
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
    listGuid: {
      required: false
    },
    templateGuid: {
      required: false
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
    campaignGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      guid: data.params.campaignGuid,
      teamGuid: data.session.teamGuid
    }}).then((campaign) => {
      if (!campaign) { return next(new Error('campaign not found')) }

      campaign.updateAttributes(data.params).then(() => {
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
    campaignGuid: {
      required: true
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
      guid: data.params.campaignGuid,
      teamGuid: data.team.guid
    }}).then((campaign) => {
      if (!campaign) { return next(new Error('campaign not found')) }

      campaign.stats(data.params.start, data.params.end, data.params.interval, (error, terms, totals) => {
        if (error) { return next(error) }
        data.response.totals = totals
        Object.keys(terms).forEach((term) => {
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
    campaignGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.Campaign.findOne({where: {
      guid: data.params.campaignGuid,
      teamGuid: data.session.teamGuid
    }}).then((campaign) => {
      if (!campaign) { return next(new Error('campaign not found')) }
      campaign.destroy().then(() => {
        next()
      })
    }).catch(next)
  }
}
