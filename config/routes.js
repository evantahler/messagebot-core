exports.default = { 
  routes: function(api){
    return {
      
      get: [
        { path: '/swagger',              action: 'swagger' },
        { path: '/system/status',        action: 'system:status' },
        { path: '/system/documentation', action: 'system:documentation' },
        { path: '/user',                 action: 'user:view' },
      ],

      post: [
        { path: '/session', action: 'session:create' },
        { path: '/user',    action: 'user:create' },
      ],

      put: [
        { path: '/session', action: 'session:check' },
        { path: '/user',    action: 'user:edit' },
      ],

      delete: [
        { path: '/session', action: 'session:destroy' },
        { path: '/user',    action: 'user:delete' },
      ],
            
    };
  }
};