exports.templateCreate = {
  name:                   'template:create',
  description:            'template:create',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    name:         { required: true },
    description:  { required: true },
    template:     { required: false },
    folder: {
      required: true,
      default: function(){ return 'default'; }
    }
  },

  run: function(api, data, next){
    var template = api.models.template.build(data.params);
    template.teamId = data.session.teamId;

    template.save().then(function(){
      data.response.template = template.apiData();
      next();
    }).catch(function(errors){
      next(errors.errors[0].message);
    });
  }
};

exports.templateView = {
  name:                   'template:view',
  description:            'template:view',
  outputExample:          {},
  middleware:             ['logged-in-session'],

  inputs: {
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {
      id: data.params.templateId,
      teamId: data.session.teamId,
    }}).then(function(template){
      if(!template){ return next(new Error('template not found')); }
      data.response.template = template.apiData();
      next();
    }).catch(next);
  }
};

exports.templateRender = {
  name:                   'template:render',
  description:            'template:render',
  matchExtensionMimeType: true,
  outputExample:          {},
  middleware:             ['logged-in-session', 'require-team'],

  inputs: {
    personGuid: { required: true },
    temporaryTemplate: { required: false },
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    trackBeacon: {
      required: false,
      default: false,
      formatter: function(p){
        if(p === 'true' || p === true){ return true; }
        return false;
      }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {
      id: data.params.templateId,
      teamId: data.session.teamId,
    }}).then(function(template){
      var person = new api.models.person(data.team, data.params.personGuid);
      person.hydrate(function(error){
        if(error){ return next(error); }
        if(data.params.temporaryTemplate){ template.template = data.params.temporaryTemplate; }
        template.render(person, null, null, null, data.params.trackBeacon, function(error, html, view){
          if(error){ return next(error); }
          if(data.connection.extension === 'html'){
            data.toRender = false;
            for(var i in data.connection.rawConnection.responseHeaders){
              if(data.connection.rawConnection.responseHeaders[i][0] === 'Content-Type'){
                delete data.connection.rawConnection.responseHeaders[i];
              }
            }

            data.connection.rawConnection.responseHeaders.push(['Content-Type', 'text/html']);
            data.connection.rawConnection.res.writeHead(200, data.connection.rawConnection.responseHeaders);
            data.connection.rawConnection.res.end(html);
            data.connection.destroy();
            next();
          }else{
            data.response.html = html;
            data.response.view = view;
            next();
          }
        });
      });
    }).catch(next);
  }
};

exports.templateCopy = {
  name:                   'template:copy',
  description:            'template:copy',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    name: { required: true },
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {
      id: data.params.templateId,
      teamId: data.session.teamId,
    }}).then(function(template){
      if(!template){ return next(new Error('template not found')); }
      var newTemplate = api.models.template.build({
        name:        data.params.name,
        teamId:      template.teamId,
        description: template.description,
        folder:      template.folder,
        template:    template.template,
      });
      newTemplate.save().then(function(){
        data.response.template = newTemplate.apiData();
        next();
      }).catch(function(errors){
        next(errors.errors[0].message);
      });
    }).catch(next);
  }
};

exports.templateEdit = {
  name:                   'template:edit',
  description:            'template:edit',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    name:         { required: false },
    description:  { required: false },
    template:     { required: false },
    folder:       { required: false },
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {
      id: data.params.templateId,
      teamId: data.session.teamId,
    }}).then(function(template){
      if(!template){ return next(new Error('template not found')); }
      template.updateAttributes(data.params).then(function(){
        data.response.template = template.apiData();
        next();
      }).catch(next);
    }).catch(next);
  }
};

exports.templateDelete = {
  name:                   'template:delete',
  description:            'template:delete',
  outputExample:          {},
  middleware:             ['logged-in-session', 'role-required-admin'],

  inputs: {
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {
      id: data.params.templateId,
      teamId: data.session.teamId,
    }}).then(function(template){
      if(!template){ return next(new Error('template not found')); }
      template.destroy().then(function(){ next(); }).catch(next);
    }).catch(next);
  }
};
