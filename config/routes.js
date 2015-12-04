exports.default = { 
  routes: function(api){
    return {
      
      get: [
        { path: '/swagger',              action: 'swagger' },
        { path: '/system/status',        action: 'system:status' },
        { path: '/system/documentation', action: 'system:documentation' },
        { path: '/user',                 action: 'user:view' },
        { path: '/person',               action: 'person:view' },
      ],

      post: [
        { path: '/session', action: 'session:create' },
        { path: '/user',    action: 'user:create' },
        { path: '/person',  action: 'person:create' },
        { path: '/people',  action: 'people:search' },
      ],

      put: [
        { path: '/session', action: 'session:check' },
        { path: '/user',    action: 'user:edit' },
        { path: '/person',  action: 'person:edit' },
      ],

      delete: [
        { path: '/session', action: 'session:destroy' },
        { path: '/user',    action: 'user:delete' },
        { path: '/person',  action: 'person:delete' },
      ],
            
    };
  }
};