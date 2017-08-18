exports.templateCreate = {
  name: 'template:create',
  description: 'template:create',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    description: { required: true },
    template: { required: false },
    folder: {
      required: true,
      default: function () { return 'default' }
    }
  },

  run: function (api, data, next) {
    let template = api.models.Template.build(data.params)
    template.teamGuid = data.session.teamGuid

    template.save().then(() => {
      data.response.template = template.apiData()
      next()
    }).catch((errors) => {
      next(errors.errors[0].message)
    })
  }
}

exports.templateView = {
  name: 'template:view',
  description: 'template:view',
  outputExample: {},
  middleware: ['logged-in-session'],

  inputs: {
    templateGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.Template.findOne({where: {
      guid: data.params.templateGuid,
      teamGuid: data.session.teamGuid
    }}).then((template) => {
      if (!template) { return next(new Error('template not found')) }
      data.response.template = template.apiData()
      next()
    }).catch(next)
  }
}

exports.templateRender = {
  name: 'template:render',
  description: 'template:render',
  matchExtensionMimeType: true,
  outputExample: {},
  middleware: ['logged-in-session', 'require-team'],

  inputs: {
    personGuid: { required: true },
    temporaryTemplate: { required: false },
    templateGuid: {
      required: true
    },
    trackBeacon: {
      required: false,
      default: false,
      formatter: function (p) {
        if (p === 'true' || p === true) { return true }
        return false
      }
    }
  },

  run: function (api, data, next) {
    api.models.Template.findOne({where: {
      guid: data.params.templateGuid,
      teamGuid: data.session.teamGuid
    }}).then((template) => {
      api.models.Person.findOne({
        where: {guid: data.params.personGuid}
      }).then((person) => {
        if (!person) { return next(new Error('person not found')) }
        person.hydrate((error) => {
          if (error) { return next(error) }
          if (data.params.temporaryTemplate) { template.template = data.params.temporaryTemplate }

          template.render(person, null, null, null, data.params.trackBeacon, (error, html, view) => {
            if (error) { return next(error) }
            if (data.connection.extension === 'html') {
              data.toRender = false
              for (let i in data.connection.rawConnection.responseHeaders) {
                if (data.connection.rawConnection.responseHeaders[i][0] === 'Content-Type') {
                  data.connection.rawConnection.responseHeaders.splice(i, 1)
                }
              }

              data.connection.rawConnection.responseHeaders.push(['Content-Type', 'text/html'])
              data.connection.rawConnection.res.writeHead(200, data.connection.rawConnection.responseHeaders)
              data.connection.rawConnection.res.end(html)
              data.connection.destroy()
              next()
            } else {
              data.response.html = html
              data.response.view = view
              next()
            }
          })
        })
      }).catch(next)
    }).catch(next)
  }
}

exports.templateCopy = {
  name: 'template:copy',
  description: 'template:copy',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    templateGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.Template.findOne({where: {
      guid: data.params.templateGuid,
      teamGuid: data.session.teamGuid
    }}).then((template) => {
      if (!template) { return next(new Error('template not found')) }
      let newTemplate = api.models.Template.build({
        name: data.params.name,
        teamGuid: template.teamGuid,
        description: template.description,
        folder: template.folder,
        template: template.template
      })
      newTemplate.save().then(() => {
        data.response.template = newTemplate.apiData()
        next()
      }).catch((errors) => {
        next(errors.errors[0].message)
      })
    }).catch(next)
  }
}

exports.templateEdit = {
  name: 'template:edit',
  description: 'template:edit',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    templateGuid: {
      required: true
    },
    name: { required: false },
    description: { required: false },
    template: { required: false },
    folder: { required: false }
  },

  run: function (api, data, next) {
    api.models.Template.findOne({where: {
      guid: data.params.templateGuid,
      teamGuid: data.session.teamGuid
    }}).then((template) => {
      if (!template) { return next(new Error('template not found')) }
      template.updateAttributes(data.params).then(() => {
        data.response.template = template.apiData()
        next()
      }).catch(next)
    }).catch(next)
  }
}

exports.templateDelete = {
  name: 'template:delete',
  description: 'template:delete',
  outputExample: {},
  middleware: ['logged-in-session', 'role-required-admin'],

  inputs: {
    templateGuid: {
      required: true
    }
  },

  run: function (api, data, next) {
    api.models.Template.findOne({where: {
      guid: data.params.templateGuid,
      teamGuid: data.session.teamGuid
    }}).then((template) => {
      if (!template) { return next(new Error('template not found')) }
      template.destroy().then(() => { next() }).catch(next)
    }).catch(next)
  }
}
