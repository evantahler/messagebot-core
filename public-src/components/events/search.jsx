import React from 'react';
import { Row, Col, Form, Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import RecordsList from './../utils/RecordsList.jsx';
import HeatMap from './../utils/maps/heatMap.jsx';
import StackedHistogram from './../utils/stackedHistogram.jsx';

const EventsSearch = React.createClass({
  getInitialState(){

    return {
      section: 'events',
      pendingQuery: (this.props.params.query || ''),
      query: (this.props.params.query || ''),
    };
  },

  doSearch: function(event){
    event.preventDefault();
    this.setState({query: this.state.pendingQuery}, () => {
      document.location.href = `/#/events/search/${this.state.query}/0`;
    });
  },

  updateQuery: function(event){
    this.setState({pendingQuery: event.target.value});
  },

  render(){
    return(
      <div>
        <h1>Events</h1>

        <Form onSubmit={this.doSearch} horizontal>
          <FormGroup controlId="formHorizontalEmail">
            <Col componentClass={ControlLabel} sm={2}>
              <strong>Query:</strong>
              <p><em>(use * for wildcards)</em></p>
            </Col>
            <Col md={10}>
              <FormControl value={this.state.pendingQuery} type="text" placeholder="email:evan@messagebot.com, firstName:evan" onChange={this.updateQuery}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col mdOffset={2} md={10}>
              <Button type="submit">Search</Button>
            </Col>
          </FormGroup>
        </Form>

        <StackedHistogram
          section={this.state.section}
          client={this.props.client}
          query={this.state.query}
        />

        <HeatMap
          section={this.state.section}
          client={this.props.client}
          query={this.state.query}
        />

        <RecordsList
          section={this.state.section}
          client={this.props.client}
          params={this.props.params}
          query={this.state.query}
          location={this.props.location}
        />
      </div>
    );
  }
});

export default EventsSearch;
