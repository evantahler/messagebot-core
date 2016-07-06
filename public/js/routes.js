var routes = [
  // ROUTE                           PAGE PARTIAL                    PAGE TITLE                REQUIRE LOGIN
  [ '/',                             'pages/home.html',              'MessageBot',             false ],
  [ '/home',                         'pages/home.html',              'MessageBot',             false ],

  [ '/dashboard',                    'pages/dashboard.html',         'MessageBot: Dashboard',  true ],

  [ '/people/recent',                'pages/people/recent.html',     'MessageBot: People',     true ],
  [ '/people/recent/:page',          'pages/people/recent.html',     'MessageBot: People',     true ],
  [ '/people/search',                'pages/people/search.html',     'MessageBot: People',     true ],
  [ '/people/search/:query',         'pages/people/search.html',     'MessageBot: People',     true ],
  [ '/people/search/:query/:page',   'pages/people/search.html',     'MessageBot: People',     true ],
  [ '/person/:guid',                 'pages/person/view.html',       'MessageBot: Person',     true ],

  [ '/events/recent',                'pages/events/recent.html',    'MessageBot: Events',      true ],
  [ '/events/recent/:page',          'pages/events/recent.html',    'MessageBot: Events',      true ],
  [ '/events/search',                'pages/events/search.html',    'MessageBot: Events',      true ],
  [ '/events/search/:query',         'pages/events/search.html',    'MessageBot: Events',      true ],
  [ '/events/search/:query/:page',   'pages/events/search.html',    'MessageBot: Events',      true ],
  [ '/event/:guid',                  'pages/event/view.html',       'MessageBot: Event',       true ],

  [ '/messages/recent',              'pages/messages/recent.html',  'MessageBot: Messages',    true ],
  [ '/messages/recent/:page',        'pages/messages/recent.html',  'MessageBot: Messages',    true ],
  [ '/messages/search',              'pages/messages/search.html',  'MessageBot: Messages',    true ],
  [ '/messages/search/:query',       'pages/messages/search.html',  'MessageBot: Messages',    true ],
  [ '/messages/search/:query/:page', 'pages/messages/search.html',  'MessageBot: Messages',    true ],
  [ '/message/:guid',                'pages/message/view.html',     'MessageBot: Message',     true ],

  [ '/lists/list',                   'pages/lists/list.html',       'MessageBot: Lists',       true ],
  [ '/lists/list/:page',             'pages/lists/list.html',       'MessageBot: Lists',       true ],
  [ '/list/:listId/people',          'pages/lists/people.html',     'MessageBot: List People', true ],
  [ '/list/:listId/people/:page',    'pages/lists/people.html',     'MessageBot: List People', true ],

  [ '/template/:templateId',         'pages/templates/edit.html',   'MessageBot: Template',    true ],
  [ '/templates/list',               'pages/templates/list.html',   'MessageBot: Templates',   true ],
  [ '/templates/list/:page',         'pages/templates/list.html',   'MessageBot: Templates',   true ],

  [ '/campaign/:campaignId',         'pages/campaigns/edit.html',   'MessageBot: Campaign',    true ],
  [ '/campaign/:campaignId/stats',   'pages/campaigns/stats.html',  'MessageBot: Campaign',    true ],
  [ '/campaigns/list',               'pages/campaigns/list.html',   'MessageBot: Campaigns',   true ],
  [ '/campaigns/list/:page',         'pages/campaigns/list.html',   'MessageBot: Campaigns',   true ],

  [ '/account',                      'pages/account.html',          'MessageBot: Account',     true ],
  [ '/users',                        'pages/users.html',            'MessageBot: Users',       true ],
  [ '/settings',                     'pages/settings.html',         'MessageBot: Settings',    true ],

  [ '/logout',                       'pages/session/destroy.html',  'MessageBot: Log Out',    false ],
];
