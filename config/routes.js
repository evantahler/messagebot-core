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
        { path: '/template',             action: 'template:view' },
        { path: '/template/render.html', action: 'template:render' },
        { path: '/template/render',      action: 'template:render' },
        { path: '/templates',            action: 'templates:list' },
        { path: '/campaign',             action: 'campaign:view' },
        { path: '/campaigns',            action: 'campaigns:list' },
        { path: '/transports',           action: 'transports:list' },
      ],

      post: [
        { path: '/session',              action: 'session:create' },
        { path: '/user',                 action: 'user:create' },
        { path: '/list',                 action: 'list:create' },
        { path: '/list/copy',            action: 'list:copy' },
        { path: '/list/people',          action: 'list:people:count' },
        { path: '/campaign',             action: 'campaign:create' },
        { path: '/campaign/copy',        action: 'campaign:copy' },
        { path: '/person',               action: 'person:create' },
        { path: '/event',                action: 'event:create' },
        { path: '/message',              action: 'message:create' },
        { path: '/template',             action: 'template:create' },
        { path: '/template/copy',        action: 'template:copy' },
      ],

      put: [
        { path: '/session',              action: 'session:check' },
        { path: '/user',                 action: 'user:edit' },
        { path: '/list',                 action: 'list:edit' },
        { path: '/campaign',             action: 'campaign:edit' },
        { path: '/list/people',          action: 'list:people:add' },
        { path: '/person',               action: 'person:edit' },
        { path: '/event',                action: 'event:edit' },
        { path: '/message',              action: 'message:edit' },
        { path: '/template',             action: 'template:edit' },
      ],

      delete: [
        { path: '/session',              action: 'session:delete' },
        { path: '/user',                 action: 'user:delete' },
        { path: '/list',                 action: 'list:delete' },
        { path: '/list/people',          action: 'list:people:delete' },
        { path: '/campaign',             action: 'campaign:delete' },
        { path: '/person',               action: 'person:delete' },
        { path: '/event',                action: 'event:delete' },
        { path: '/message',              action: 'message:delete' },
        { path: '/template',             action: 'template:delete' },
      ],

    };
  }
};
