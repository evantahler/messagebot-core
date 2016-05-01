var transportValidator = function(p){
  var api = this;
  var transportNames = [];

  api.transports.forEach(function(t){ transportNames.push(t.name); });
  if( transportNames.indexOf(p) < 0 ){
    return new Error(p + ' is not a valid transport');
  }else{
    return true;
  }
}

exports.templateCreate = {
  name:                   'template:create',
  description:            'template:create',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name:         { required: true },
    description:  { required: true },
    template:     { required: false },
    folder: {
      required: true,
      default: function(){ return 'default'; }
    },
    transport: {
      required: true,
      validator: transportValidator
    }
  },

  run: function(api, data, next){
    var template = api.models.template.build(data.params);
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
  middleware:             [ 'logged-in-session' ],

  inputs: {
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {id: data.params.templateId}}).then(function(template){
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
  middleware:             [ 'logged-in-session' ],

  inputs: {
    userGuid: { required: true },
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.template.renderToDisk(data.params.templateId, data.params.userGuid, function(error, file, fileBase, view){
      if(error){ return next(error); }
      if(data.connection.extension === 'html'){
        data.toRender = false;
        data.connection.rawConnection.responseHttpCode = 200;
        data.connection.sendFile(fileBase);
        next();
      }else{
        data.response.view = view;
        next();
      }
    });
  }
};

exports.templateCopy = {
  name:                   'template:copy',
  description:            'template:copy',
  outputExample:          {},
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    name: { required: true },
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {id: data.params.templateId}}).then(function(template){
      if(!template){ return next(new Error('template not found')); }
      var newTemplate = api.models.template.build({
        name:        data.params.name,
        description: template.description,
        folder:      template.folder,
        transport:   template.transport,
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
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    },
    name:         { required: false },
    description:  { required: false },
    template:     { required: false },
    folder:       { required: false },
    transport: {
      required: false,
      validator: transportValidator
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {id: data.params.templateId}}).then(function(template){
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
  middleware:             [ 'logged-in-session', 'status-required-admin' ],

  inputs: {
    templateId: {
      required: true,
      formatter: function(p){ return parseInt(p); }
    }
  },

  run: function(api, data, next){
    api.models.template.findOne({where: {id: data.params.templateId}}).then(function(template){
      if(!template){ return next(new Error('template not found')); }
      template.destroy().then(function(){ next(); }).catch(next);
    }).catch(next);
  }
};
