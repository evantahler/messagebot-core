exports.templateCreate = {
  name:                   'template:create',
  description:            'template:create',
  outputExample:          {},
  middleware:             ['logged-in-session', 'status-required-admin'],

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
      data.response.template = template.apiData(api);
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
      data.response.template = template.apiData(api);
      next();
    }).catch(next);
  }
};

exports.templateRender = {
  name:                   'template:render',
  description:            'template:render',
  matchExtensionMimeType: true,
  outputExample:          {},
  middleware:             ['logged-in-session'],

  inputs: {
    personGuid: { required: true },
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    var team = api.utils.determineActionsTeam(data);
    if(!team){ return next(new Error('Team not found for this request')); }

    api.models.template.findOne({where: {
      id: data.params.templateId,
      teamId: data.session.teamId,
    }}).then(function(template){
      api.template.renderToDisk(team, data.params.templateId, data.params.personGuid, null, function(error, file, fileBase, view){
        if(data.connection.extension === 'html'){
          if(error){ return next(error); }
          data.toRender = false;
          data.connection.rawConnection.responseHttpCode = 200;
          data.connection.sendFile(fileBase);
          next();
        }else{
          if(error && !view){ return next(error); }
          data.response.view = view;
          next();
        }
      });
    }).catch(next);
  }
};

exports.templateCopy = {
  name:                   'template:copy',
  description:            'template:copy',
  outputExample:          {},
  middleware:             ['logged-in-session', 'status-required-admin'],

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
        data.response.template = newTemplate.apiData(api);
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
  middleware:             ['logged-in-session', 'status-required-admin'],

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
        data.response.template = template.apiData(api);
        next();
      }).catch(next);
    }).catch(next);
  }
};

exports.templateDelete = {
  name:                   'template:delete',
  description:            'template:delete',
  outputExample:          {},
  middleware:             ['logged-in-session', 'status-required-admin'],

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
