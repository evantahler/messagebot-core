import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, Link, hashHistory, IndexRedirect} from 'react-router';

import Page           from './components/page.jsx';

import Home           from './components/home.jsx';
import About          from './components/about.jsx';
import Dashboard      from './components/dashboard.jsx';

import PersonNew      from './components/person/new.jsx';
import PersonView     from './components/person/view.jsx';
import PeopleRecent   from './components/people/recent.jsx';
import PeopleSearch   from './components/people/search.jsx';

import EventNew       from './components/event/new.jsx';
import EventView      from './components/event/view.jsx';
import EventsRecent   from './components/events/recent.jsx';
import EventsSearch   from './components/events/search.jsx';

import MessageNew     from './components/message/new.jsx';
import MessageView    from './components/message/view.jsx';
import MessagesRecent from './components/messages/recent.jsx';
import MessagesSearch from './components/messages/search.jsx';

import ListsList      from './components/lists/list.jsx';
import ListPeople     from './components/list/people.jsx';

import TemplatesList  from './components/templates/list.jsx';
import TemplateEdit   from './components/template/edit.jsx';

import CampaignsList  from './components/campaigns/list.jsx';
import CampaignEdit   from './components/campaign/edit.jsx';
import CampaignStats  from './components/campaign/stats.jsx';

import SessionDestroy from './components/session/destroy.jsx';
import UserEdit       from './components/user/edit.jsx';
import UsersList      from './components/users/list.jsx';
import SystemSettings from './components/system/settings.jsx';
import SystemStatus   from './components/system/status.jsx';

ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={Page}>
      <IndexRedirect to="/home" />

      <Route path="home"                         requirePageAuth={false} component={Home} />
      <Route path="about"                        requirePageAuth={false} component={About} />

      <Route path="logout"                       requirePageAuth={true}  component={SessionDestroy} />

      <Route path="dashboard"                    requirePageAuth={true}  component={Dashboard} />

      <Route path="person/new"                   requirePageAuth={true}  component={PersonNew} />
      <Route path="person/:guid"                 requirePageAuth={true}  component={PersonView} />
      <Route path="people/recent"                requirePageAuth={true}  component={PeopleRecent} />
      <Route path="people/recent/:page"          requirePageAuth={true}  component={PeopleRecent} />
      <Route path="people/search"                requirePageAuth={true}  component={PeopleSearch} />
      <Route path="people/search/:query"         requirePageAuth={true}  component={PeopleSearch} />
      <Route path="people/search/:query/:page"   requirePageAuth={true}  component={PeopleSearch} />

      <Route path="event/new"                    requirePageAuth={true}  component={EventNew} />
      <Route path="event/:guid"                  requirePageAuth={true}  component={EventView} />
      <Route path="events/recent"                requirePageAuth={true}  component={EventsRecent} />
      <Route path="events/recent/:page"          requirePageAuth={true}  component={EventsRecent} />
      <Route path="events/search"                requirePageAuth={true}  component={EventsSearch} />
      <Route path="events/search/:query"         requirePageAuth={true}  component={EventsSearch} />
      <Route path="events/search/:query/:page"   requirePageAuth={true}  component={EventsSearch} />

      <Route path="message/new"                  requirePageAuth={true}  component={MessageNew} />
      <Route path="message/:guid"                requirePageAuth={true}  component={MessageView} />
      <Route path="messages/recent"              requirePageAuth={true}  component={MessagesRecent} />
      <Route path="messages/recent/:page"        requirePageAuth={true}  component={MessagesRecent} />
      <Route path="messages/search"              requirePageAuth={true}  component={MessagesSearch} />
      <Route path="messages/search/:query"       requirePageAuth={true}  component={MessagesSearch} />
      <Route path="messages/search/:query/:page" requirePageAuth={true}  component={MessagesSearch} />

      <Route path="lists/list"                   requirePageAuth={true}  component={ListsList} />
      <Route path="lists/list/:folder"           requirePageAuth={true}  component={ListsList} />
      <Route path="lists/list/:folder/:page"     requirePageAuth={true}  component={ListsList} />
      <Route path="list/people/:listId"          requirePageAuth={true}  component={ListPeople} />
      <Route path="list/people/:listId/:page"    requirePageAuth={true}  component={ListPeople} />

      <Route path="templates/list"               requirePageAuth={true}  component={TemplatesList} />
      <Route path="templates/list/:folder"       requirePageAuth={true}  component={TemplatesList} />
      <Route path="templates/list/:folder/:page" requirePageAuth={true}  component={TemplatesList} />
      <Route path="template/:id"                 requirePageAuth={true}  component={TemplateEdit} />

      <Route path="campaigns/list"               requirePageAuth={true}  component={CampaignsList} />
      <Route path="campaigns/list/:folder"       requirePageAuth={true}  component={CampaignsList} />
      <Route path="campaigns/list/:folder/:page" requirePageAuth={true}  component={CampaignsList} />
      <Route path="campaign/:campaignId"         requirePageAuth={true}  component={CampaignEdit} />
      <Route path="campaign/:campaignId/stats"   requirePageAuth={true}  component={CampaignStats} />

      <Route path="settings"                     requirePageAuth={true}  component={SystemSettings} />
      <Route path="status"                       requirePageAuth={true}  component={SystemStatus} />
      <Route path="users"                        requirePageAuth={true}  component={UsersList} />
      <Route path="account"                      requirePageAuth={true}  component={UserEdit} />
    </Route>
  </Router>,

  document.getElementById('application')
);
