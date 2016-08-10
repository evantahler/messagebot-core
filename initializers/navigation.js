var fs = require('fs');
var path = require('path');
var async = require('async');

module.exports = {
  loadPriority: 999,

  initialize: function(api, next){

    api.navigation = {
      navigation: {},
      routes: [],
    };

    /* Base Routes */
    api.navigation.routes.push({route: '/',                             page: 'pages/home.html',             title: 'MessageBot',              auth: false});

    api.navigation.routes.push({route: '/home',                         page: 'pages/home.html',             title: 'MessageBot',              auth: false});

    api.navigation.routes.push({route: '/dashboard',                    page: 'pages/dashboard.html',        title: 'MessageBot: Dashboard',   auth: true});

    api.navigation.routes.push({route: '/people/recent',                page: 'pages/people/recent.html',    title: 'MessageBot: People',      auth: true});
    api.navigation.routes.push({route: '/people/recent/:page',          page: 'pages/people/recent.html',    title: 'MessageBot: People',      auth: true});
    api.navigation.routes.push({route: '/people/search',                page: 'pages/people/search.html',    title: 'MessageBot: People',      auth: true});
    api.navigation.routes.push({route: '/people/search/:query',         page: 'pages/people/search.html',    title: 'MessageBot: People',      auth: true});
    api.navigation.routes.push({route: '/people/search/:query/:page',   page: 'pages/people/search.html',    title: 'MessageBot: People',      auth: true});
    api.navigation.routes.push({route: '/person/new',                   page: 'pages/person/new.html',       title: 'MessageBot: Person',      auth: true});
    api.navigation.routes.push({route: '/person/:guid',                 page: 'pages/person/view.html',      title: 'MessageBot: Person',      auth: true});

    api.navigation.routes.push({route: '/events/recent',                page: 'pages/events/recent.html',    title: 'MessageBot: Events',      auth: true});
    api.navigation.routes.push({route: '/events/recent/:page',          page: 'pages/events/recent.html',    title: 'MessageBot: Events',      auth: true});
    api.navigation.routes.push({route: '/events/search',                page: 'pages/events/search.html',    title: 'MessageBot: Events',      auth: true});
    api.navigation.routes.push({route: '/events/search/:query',         page: 'pages/events/search.html',    title: 'MessageBot: Events',      auth: true});
    api.navigation.routes.push({route: '/events/search/:query/:page',   page: 'pages/events/search.html',    title: 'MessageBot: Events',      auth: true});
    api.navigation.routes.push({route: '/event/new',                    page: 'pages/event/new.html',        title: 'MessageBot: Event',       auth: true});
    api.navigation.routes.push({route: '/event/:guid',                  page: 'pages/event/view.html',       title: 'MessageBot: Event',       auth: true});

    api.navigation.routes.push({route: '/messages/recent',              page: 'pages/messages/recent.html',  title: 'MessageBot: Messages',    auth: true});
    api.navigation.routes.push({route: '/messages/recent/:page',        page: 'pages/messages/recent.html',  title: 'MessageBot: Messages',    auth: true});
    api.navigation.routes.push({route: '/messages/search',              page: 'pages/messages/search.html',  title: 'MessageBot: Messages',    auth: true});
    api.navigation.routes.push({route: '/messages/search/:query',       page: 'pages/messages/search.html',  title: 'MessageBot: Messages',    auth: true});
    api.navigation.routes.push({route: '/messages/search/:query/:page', page: 'pages/messages/search.html',  title: 'MessageBot: Messages',    auth: true});
    api.navigation.routes.push({route: '/message/new',                  page: 'pages/message/new.html',      title: 'MessageBot: Message',     auth: true});
    api.navigation.routes.push({route: '/message/:guid',                page: 'pages/message/view.html',     title: 'MessageBot: Message',     auth: true});

    api.navigation.routes.push({route: '/lists/list',                   page: 'pages/lists/list.html',       title: 'MessageBot: Lists',       auth: true});
    api.navigation.routes.push({route: '/lists/list/:folder',           page: 'pages/lists/list.html',       title: 'MessageBot: Lists',       auth: true});
    api.navigation.routes.push({route: '/lists/list/:folder/:page',     page: 'pages/lists/list.html',       title: 'MessageBot: Lists',       auth: true});
    api.navigation.routes.push({route: '/list/:listId/people',          page: 'pages/lists/people.html',     title: 'MessageBot: List People', auth: true});
    api.navigation.routes.push({route: '/list/:listId/people/:page',    page: 'pages/lists/people.html',     title: 'MessageBot: List People', auth: true});

    api.navigation.routes.push({route: '/template/:templateId',         page: 'pages/templates/edit.html',   title: 'MessageBot: Template',    auth: true});
    api.navigation.routes.push({route: '/templates/list',               page: 'pages/templates/list.html',   title: 'MessageBot: Templates',   auth: true});
    api.navigation.routes.push({route: '/templates/list/:folder',       page: 'pages/templates/list.html',   title: 'MessageBot: Templates',   auth: true});
    api.navigation.routes.push({route: '/templates/list/:folder/:page', page: 'pages/templates/list.html',   title: 'MessageBot: Templates',   auth: true});

    api.navigation.routes.push({route: '/campaign/:campaignId',         page: 'pages/campaigns/edit.html',   title: 'MessageBot: Campaign',    auth: true});
    api.navigation.routes.push({route: '/campaign/:campaignId/stats',   page: 'pages/campaigns/stats.html',  title: 'MessageBot: Campaign',    auth: true});
    api.navigation.routes.push({route: '/campaigns/list',               page: 'pages/campaigns/list.html',   title: 'MessageBot: Campaigns',   auth: true});
    api.navigation.routes.push({route: '/campaigns/list/:folder',       page: 'pages/campaigns/list.html',   title: 'MessageBot: Campaigns',   auth: true});
    api.navigation.routes.push({route: '/campaigns/list/:folder/:page', page: 'pages/campaigns/list.html',   title: 'MessageBot: Campaigns',   auth: true});

    api.navigation.routes.push({route: '/status',                       page: 'pages/status.html',           title: 'MessageBot: Status',      auth: true});
    api.navigation.routes.push({route: '/account',                      page: 'pages/account.html',          title: 'MessageBot: Account',     auth: true});
    api.navigation.routes.push({route: '/users',                        page: 'pages/users.html',            title: 'MessageBot: Users',       auth: true});
    api.navigation.routes.push({route: '/settings',                     page: 'pages/settings.html',         title: 'MessageBot: Settings',    auth: true});

    api.navigation.routes.push({route: '/logout',                       page: 'pages/session/destroy.html',  title: 'MessageBot: Log Out',     auth: false});

    next();
  },

  start: function(api, next){
    var generateStringContent = function(name, data){
      var s = '\'use strict\';\r\n';
      s += 'var MESSAGEBOT = MESSAGEBOT || {};\r\n';
      s += 'MESSAGEBOT.' + name + ' = JSON.parse(\'' + JSON.stringify(data) + '\');';

      return s;
    };

    var jobs = [];
    if(!api.config.general.paths.public || api.config.general.paths.public.length === 0){
      return next(new Error('No public paths in this project'));
    }

    ['routes', 'navigation'].forEach(function(type){
      jobs.push(function(done){
        var file = path.normalize(api.config.general.paths.public[0] + path.sep + 'js' + path.sep + type + '.js');
        api.log(['writing navigation file: %s', file], 'info');
        fs.writeFile(file, generateStringContent(type, api.navigation[type]), done);
      });
    });

    async.parallel(jobs, next);
  }
};
