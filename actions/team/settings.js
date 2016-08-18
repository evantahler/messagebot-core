exports.settingsView = {
  name:                   'settings:list',
  description:            'settings:list',
  outputExample:          {},
  middleware:             ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {},

  run: function(api, data, next){
    api.models.setting.findAll({
      where:{ teamId: data.team.id },
      order: [['key', 'desc']],
    }).then(function(settings){
      data.response.settings = {};
      settings.forEach(function(setting){
        var d = setting.apiData();
        data.response.settings[d.key] = d;
      });

      next();
    }).catch(next);
  }
};

exports.settingsEdit = {
  name:                   'setting:edit',
  description:            'setting:edit',
  outputExample:          {},
  middleware:             ['logged-in-session', 'require-team', 'role-required-admin'],

  inputs: {
    key:   {required: true},
    value: {required: true},
  },

  run: function(api, data, next){
    api.models.setting.findOne({
      where:{
        teamId: data.team.id,
        key: data.params.key
      },
    }).then(function(setting){
      if(!setting){ return next(new Error('Setting not found')); }
      setting.updateAttributes({
        value: data.params.value
      }).then(function(){
        data.response.setting = setting.apiData();
        next();
      }).catch(next);
    }).catch(next);
  }
};
