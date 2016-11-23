module.exports = {
  loadPriority: 999,
  initialize: function (api, next) {
    api.navigation = {
      navigation: []
    }

    /* Logged Out */

    api.navigation.navigation.push({
      title: 'MessageBot',
      align: 'left',
      glyphicon: 'info-sign',
      loggedIn: false,
      elements: [
        {route: '/', title: 'Home', glyphicon: 'user', highlights: ['^/$']},
        {route: '/about', title: 'About', glyphicon: 'info-sign', highlights: ['^/about$']}
      ]
    })

    /* Base Navigation */

    api.navigation.navigation.push({
      title: 'Data',
      align: 'left',
      glyphicon: 'equalizer',
      loggedIn: true,
      elements: [
        {route: '/people/recent', title: 'People: Recent', glyphicon: 'user', highlights: ['^/people/recent.*$']},
        {route: '/people/search', title: 'People: Search', glyphicon: 'user', highlights: ['^/people/search.*$']},
        {route: '/person/new', title: 'Person: New', glyphicon: 'user', highlights: ['^/person/new$']},
        {divider: true},
        {route: '/events/recent', title: 'Events: Recent', glyphicon: 'equalizer', highlights: ['^/events/recent.*$']},
        {route: '/events/search', title: 'Events: Search', glyphicon: 'equalizer', highlights: ['^/events/search.*$']},
        {route: '/event/new', title: 'Event: New', glyphicon: 'equalizer', highlights: ['^/event/new$']},
        {divider: true},
        {route: '/messages/recent', title: 'Messages: Recent', glyphicon: 'envelope', highlights: ['^/messages/recent.*$']},
        {route: '/messages/search', title: 'Messages: Search', glyphicon: 'envelope', highlights: ['^/messages/search.*$']}
        // {route: '/message/new', title: 'Message: New', glyphicon: 'envelope', highlights: ['^\/message\/new$']},
      ]
    })

    api.navigation.navigation.push({
      title: 'Communication',
      align: 'left',
      glyphicon: 'send',
      loggedIn: true,
      elements: [
        {route: '/lists/list', title: 'Lists', glyphicon: 'folder-open', highlights: ['^/lists/list.*$', '^/list/.*$']},
        {route: '/templates/list', title: 'Templates', glyphicon: 'file', highlights: ['^/templates/list.*$', '^/template/.*$']},
        {route: '/campaigns/list', title: 'Campaigns', glyphicon: 'send', highlights: ['^/campaigns/list.*$', '^/campaign/.*$']}
      ]
    })

    api.navigation.navigation.push({
      title: 'System',
      align: 'right',
      glyphicon: 'flash',
      loggedIn: true,
      elements: [
        {route: '/system/status', title: 'Status', glyphicon: 'flash', highlights: ['^/status$']},
        {divider: true},
        {route: '/system/settings', title: 'Settings', glyphicon: 'cog', highlights: ['^/settings$']},
        // {route: '/swagger', title: 'API', glyphicon: 'cloud', highlights: null},
        {route: '/system/resque/overview', title: 'Resque', glyphicon: 'road', highlights: null},
        {divider: true},
        {route: '/user/edit', title: 'Account', glyphicon: 'user', highlights: ['^/account$']},
        {route: '/users/list', title: 'Users', glyphicon: 'th', highlights: ['^/users$']},
        {route: '/logout', title: 'Log Out', glyphicon: 'off', highlights: ['^/logout$']}
      ]
    })

    next()
  }
}
