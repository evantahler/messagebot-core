import React from 'react';
import { Table, Glyphicon, Form, FormGroup, FormControl, ControlLabel, Button, Row, Col } from 'react-bootstrap';
import WordHelper from './wordHelper.jsx';
import LazyTable from './lazyTable.jsx';
import PointMap from './maps/pointMap.jsx';
import LazyIframe from './lazyIframe.jsx';
import Moment from 'moment';

const RecordView = React.createClass({
  getInitialState(){
    return {
      guid: this.props.guid,
      record: {},
      lists: [],
      recordType: this.props.recordType,
      renderableData: [
        'data',
        'personGuid',
        'eventGuid',
        'messageGuid',
        'location',
        'body',
        'campaignId'
      ]
    };
  },

  componentDidMount(){
    this.loadRecord();
  },

  deleteRecord(){
    const client = this.props.client;
    if(
      confirm('are you sure?')
    ){
      client.action({
        guid: this.state.guid
      }, '/api/' + this.state.recordType, 'DELETE', (data) => {
        window.location.href = '/#/' + WordHelper.pluralize(this.state.recordType) + '/recent';
      });
    }
  },

  loadRecord(attempts, lastError){
    const client = this.props.client;
    if(!attempts){ attempts = 0; }

    attempts++;
    if(attempts > 5){
      return client.notify(lastError, 'error');
    }

    client.action({
      guid: this.state.guid
    }, '/api/' + this.state.recordType, 'GET', (data) => {
      this.setState({
        record: data[this.state.recordType]
      }, () => {
        if(data.lists){ this.setState({lists: data.lists}); }
      });
    }, function(error){
      client.notify('...', 'info');
      setTimeout(() => {
        this.loadRecord(attempts, error);
      }, 1000);
    });
  },

  render(){
    return(
      <div>
        <h1>Person #{this.state.guid}</h1>
        <p className="text-warning">Delete this {this.state.recordType}: <Glyphicon onClick={this.deleteRecord} glyph="remove"/></p>

        <ul>
          {
            Object.keys(this.state.record).map((key) => {
              const value = this.state.record[key];
              const title = WordHelper.titleize(key);

              // special data we can render
              if(key === 'createdAt' || key === 'updatedAt'){
                let d = new Date(Date.parse(value));
                return <li key={key}><strong>{title}: </strong>{ Moment(d).fromNow() }</li>;
              }

              else if(key === 'location'){
                return <li key={key}><strong>Location:</strong> {JSON.stringify(value)}</li>;
              }

              if(key === 'personGuid'){
                return <li key={key}><a href={`/#/person/${value}`}><strong>{title}: </strong>{value}</a></li>;
              }

              else if(key === 'eventGuid'){
                return <li key={key}><a href={`/#/event/${value}`}><strong>{title}: </strong>{value}</a></li>;
              }

              else if(key === 'messageGuid'){
                return <li key={key}><a href={`/#/message/${value}`}><strong>{title}: </strong>{value}</a></li>;
              }

              else if(key === 'listId'){
                return <li key={key}><a href={`/#/list/${value}`}><strong>{title}: </strong>{value}</a></li>;
              }

              else if(key === 'campaignId'){
                return <li key={key}><a href={`/#/campaign/${value}/stats`}><strong>{title}: </strong>{value}</a></li>;
              }

              // special data we can render

              else if(this.state.renderableData.indexOf(key) < 0){
                return <li key={key}><strong>{title}: </strong>{value}</li>;
              }
            })
          }
        </ul>

        <br />

        <_DataRowTable
          client={this.props.client}
          record={this.state.record}
          recordType={this.state.recordType}
        />

        <PointMap
          point={this.state.record.location}
          name={'Most Recent Event'}
        />

        <_ListsTable
          lists={this.state.lists}
        />

        <LazyIframe body={this.state.record.body || ''} />

      </div>
    );
  }
});

const _ListsTable = React.createClass({
  render(){
    if(!this.props.lists || this.props.lists.length === 0){
      return null;
    }

    return(
      <div>
        <h2>Lists</h2>
        <LazyTable
          objects={this.props.lists}
        />
      </div>
    );
  }
});

const _DataRowTable = React.createClass({
  getInitialState(){
    return {
      record: (this.props.record || {}),
      pendingKey: '',
      pendingValue: '',
      dataRows: [],
    };
  },

  componentWillReceiveProps(newProps){
    this.setState({record: newProps.record}, () => {
      this.buildDataRows();
    });
  },

  handleEdit(row){
    const client = this.props.client;

    let newData = {};
    newData[row.id] = row.value;
    client.action({
      guid: this.state.record.guid,
      data: JSON.stringify(newData),
    }, '/api/' + this.props.recordType, 'PUT', (data) => {
      this.setState({
        record: data[this.props.recordType]
      }, () => {
        this.buildDataRows();
        client.notify('Updated', 'success');
      });
    });
  },

  handleDestroy(event){
    const client = this.props.client;

    let newData = {};
    newData[event.target.id] = '_delete';
    client.action({
      guid: this.state.record.guid,
      data: JSON.stringify(newData),
    }, '/api/' + this.props.recordType, 'PUT', (data) => {
      this.setState({
        record: data[this.props.recordType]
      }, () => {
        this.buildDataRows();
        client.notify('Removed', 'success');
      });
    });
  },

  updatePendingKey(event){
    this.setState({pendingKey: event.target.value});
  },

  updatePendingValue(event){
    this.setState({pendingValue: event.target.value});
  },

  addAttribute(){
    const client = this.props.client;

    if(this.state.pendingKey === '' || this.state.pendingValue === ''){ return; }

    let newData = {};
    newData[this.state.pendingKey] = this.state.pendingValue;

    client.action({
      guid: this.state.record.guid,
      data: JSON.stringify(newData),
    }, '/api/' + this.props.recordType, 'PUT', (data) => {
      this.setState({
        record: data[this.props.recordType],
        pendingKey: '',
        pendingValue: '',
      }, () => {
        this.buildDataRows();
        client.notify('Updated', 'success');
      });
    });
  },

  buildDataRows(){
    const record = this.state.record;

    let dataRows = [];
    let sortedKeys = [];

    if(!record || !record.data){ return; }

    sortedKeys = Object.keys(record.data).sort();
    sortedKeys.forEach(function(key){
      dataRows.push({
        id: key,
        value: record.data[key],
      });
    });

    this.setState({dataRows: dataRows});
  },

  render(){
    return(
      <div>
        <LazyTable
          objects={this.state.dataRows}
          idName={'Key'}
          inlineEdit={{value: this.handleEdit}}
          destroy={this.handleDestroy}
        />

        <br />
        <p>Add Attribute:</p>

        <Form onSubmit={this.addAttribute} horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} md={2}>
              <strong>Key:</strong>
            </Col>
            <Col md={10}>
              <FormControl value={this.state.pendingKey} type="text" placeholder="firstName" onChange={this.updatePendingKey}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} md={2}>
              <strong>Value:</strong>
            </Col>
            <Col md={10}>
              <FormControl value={this.state.pendingValue} type="text" placeholder="Evan" onChange={this.updatePendingValue}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col mdOffset={2} md={10}>
              <Button type="submit">Add Attribute</Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    );
  }
});

export default RecordView;
