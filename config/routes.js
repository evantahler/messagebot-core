exports.default = {
  routes: function(api){
    return {

      get: [
        { path: '/swagger',              action: 'swagger' },
        { path: '/system/status',        action: 'system:status' },
        { path: '/system/documentation', action: 'system:documentation' },
        { path: '/user',                 action: 'user:view' },
        { path: '/users',                action: 'users:list' },
        { path: '/user/statuses',        action: 'user:statusesList' },
        { path: '/list',                 action: 'list:view' },
        { path: '/list/people',          action: 'list:people:view' },
        { path: '/lists',                action: 'lists:list' },
        { path: '/person',               action: 'person:view' },
        { path: '/people/search',        action: 'people:search' },
        { path: '/people/aggregation',   action: 'people:aggregation' },
        { path: '/event',                action: 'event:view' },
        { path: '/events/search',        action: 'events:search' },
        { path: '/events/aggregation',   action: 'events:aggregation' },
        { path: '/message',              action: 'message:view' },
        { path: '/messages/search',      action: 'messages:search' },
        { path: '/messages/aggregation', action: 'messages:aggregation' },
      ],

      post: [
        { path: '/session',              action: 'session:create' },
        { path: '/user',                 action: 'user:create' },
        { path: '/list',                 action: 'list:create' },
        { path: '/list/people',          action: 'list:people:count' },
        { path: '/person',               action: 'person:create' },
        { path: '/event',                action: 'event:create' },
        { path: '/message',              action: 'message:create' },
      ],

      put: [
        { path: '/session',              action: 'session:check' },
        { path: '/user',                 action: 'user:edit' },
        { path: '/list',                 action: 'list:edit' },
        { path: '/list/people',          action: 'list:people:add' },
        { path: '/person',               action: 'person:edit' },
        { path: '/event',                action: 'event:edit' },
        { path: '/message',              action: 'message:edit' },
      ],

      delete: [
        { path: '/session',              action: 'session:destroy' },
        { path: '/user',                 action: 'user:delete' },
        { path: '/list',                 action: 'list:delete' },
        { path: '/list/people',          action: 'list:people:destroy' },
        { path: '/person',               action: 'person:delete' },
        { path: '/event',                action: 'event:delete' },
        { path: '/message',              action: 'message:delete' },
      ],

    };
  }
};
