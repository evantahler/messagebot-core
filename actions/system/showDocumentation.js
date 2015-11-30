exports.documentation = {
  name: 'system:documentation',
  description: 'return API documentation',
  outputExample:{},

  run: function(api, data, next){    
    data.response.documentation = api.documentation.documentation;
    next();
  }
};