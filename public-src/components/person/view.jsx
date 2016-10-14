import React from 'react';
import { Row, Col } from 'react-bootstrap';
import RecordView from './../utils/recordView.jsx';
import LazyTable from './../utils/lazyTable.jsx';
import Moment from 'moment';

const PersonView = React.createClass({
  getInitialState(){
    return {
      guid: this.props.params.guid,
      recordType: 'person',
    };
  },

  render(){
    return(
      <div>
        <RecordView
          recordType={this.state.recordType}
          guid={this.state.guid}
          client={this.props.client}
        />

        <hr />

        <_RecentBehavior guid={this.state.guid} client={this.props.client} />
      </div>
    );
  }
});

const _RecentBehavior = React.createClass({
  getInitialState(){
    return {
      guid: this.props.guid,
      from: 0,
      size: 100,
      events: [],
      messages: [],
      totalMessages: 0,
      totalEvents: 0,
    };
  },

  loadRecentBehavior(){
    const client = this.props.client;

    client.action({
      searchKeys: 'personGuid',
      searchValues: this.state.guid,
      from: this.state.from,
      size: this.state.size,
    }, '/api/events/search', 'GET', (data) => {
      let events = [];
      data.events.forEach((e) => {
        events.push({
          guid: e.guid,
          createdAt: Moment(new Date(Date.parse(e.createdAt))).fromNow(),
          type: e.type,
        });
      });

      this.setState({
        events: events,
        totalEvents: data.total,
      });
    });

    client.action({
      searchKeys: 'personGuid',
      searchValues: this.state.guid,
      from: this.state.from,
      size: this.state.size,
    }, '/api/messages/search', 'GET', (data) => {
      let messages = [];
      data.messages.forEach((e) => {
        messages.push({
          guid: e.guid,
          createdAt: Moment(new Date(Date.parse(e.createdAt))).fromNow(),
          transport: e.transport,
        });
      });

      this.setState({
        messages: messages,
        totalMessages: data.total,
      });
    });
  },

  componentWillMount(){
    this.loadRecentBehavior();
  },

  render(){
    return(
      <Row>

        <Col md={12}>
          <h2>Recent Behavior</h2>
        </Col>

        <Col md={6}>
          <h3><a href={`/#/events/search/personGuid:${this.state.guid}`}>
            Events ({this.state.totalEvents} total)
          </a></h3>
          <p><em>Showing {this.state.events.length} most recent</em></p>

          <LazyTable
            recordType={'event'}
            objects={this.state.events}
          />
        </Col>

        <Col md={6}>
          <h3><a href={`/#/messages/search/personGuid:${this.state.guid}`}>
            Messages ({this.state.totalMessages} total)
          </a></h3>
          <p><em>Showing {this.state.messages.length} most recent</em></p>

          <LazyTable
            recordType={'message'}
            objects={this.state.messages}
          />
        </Col>

      </Row>
    );
  }
});

export default PersonView;
