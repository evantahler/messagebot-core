exports.default = { 
  routes: function(api){
    return {
      
      get: [
        { path: '/swagger',              action: 'swagger' },
        { path: '/system/status',        action: 'system:status' },
        { path: '/system/documentation', action: 'system:documentation' },
      ],

      post: [
        { path: '/session', action: 'session:create' },
      ],

      put: [
        { path: '/session', action: 'session:check' },
      ],

      delete: [
        { path: '/session', action: 'session:destroy' },
      ],
            
    };
  }
};