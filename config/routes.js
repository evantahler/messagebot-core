exports.default = { 
  routes: function(api){
    return {
      
      get: [
        { path: '/swagger',              action: 'swagger' },
        { path: '/system/status',        action: 'system:status' },
        { path: '/system/documentation', action: 'system:documentation' },
        { path: '/user',                 action: 'user:view' },
        { path: '/person',               action: 'person:view' },
        { path: '/event',                action: 'event:view' },
        { path: '/message',              action: 'message:view' },
      ],

      post: [
        { path: '/session',  action: 'session:create' },
        { path: '/user',     action: 'user:create' },
        { path: '/person',   action: 'person:create' },
        { path: '/people',   action: 'people:search' },
        { path: '/event',    action: 'event:create' },
        { path: '/events',   action: 'events:search' },
        { path: '/message',  action: 'message:create' },
        { path: '/messages', action: 'messages:search' },
      ],

      put: [
        { path: '/session', action: 'session:check' },
        { path: '/user',    action: 'user:edit' },
        { path: '/person',  action: 'person:edit' },
        { path: '/event',   action: 'event:edit' },
        { path: '/message', action: 'message:edit' },
      ],

      delete: [
        { path: '/session', action: 'session:destroy' },
        { path: '/user',    action: 'user:delete' },
        { path: '/person',  action: 'person:delete' },
        { path: '/event',   action: 'event:delete' },
        { path: '/message', action: 'message:delete' },
      ],
            
    };
  }
};