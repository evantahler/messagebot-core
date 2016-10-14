import React from 'react';
import { Row, Col, Form, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap';
import Datetime from 'react-datetime';
import WordHelper from './wordHelper.jsx';
import LazyTable from './lazyTable.jsx';

const RecordNew = React.createClass({
  getInitialState(){
    return {
      action: {},
      createdAt: new Date(),
      topLevelProperties: [],
      optionalProperties: [],
      pendingKey: '',
      pendingValue: '',
    };
  },

  loadDocumenation(){
    const client = this.props.client;

    client.action({}, '/api/system/documentation', 'GET', (data) => {
      let versions = Object.keys(data.documentation[this.props.recordType + ':create']);
      versions = versions.map(parseFloat);
      versions.sort();

      const action = data.documentation[this.props.recordType + ':create'][(versions[(versions.length - 1)])];
      let topLevelProperties = [];

      let keys = Object.keys(action.inputs);
      keys.sort();
      keys.forEach(function(key){
        const input = action.inputs[key];
        if(
          key !== 'createdAt'
          && key !== 'sync'
          && key !== 'teamId'
          && key !== 'data'
        ){
          topLevelProperties.push({
            id: key,
            value: '',
            requried: (input.required ? 'yes' : 'no')
          });
        }
      });

      this.setState({
        topLevelProperties: topLevelProperties,
        action: action,
      });
    });
  },

  componentWillMount(){
    this.loadDocumenation();
  },

  updateCreatedAt(e){
    this.setState({createdAt: e.toDate()});
  },

  handlePropEditNoOP(row){
    // This is a no-op to allow the fields to appear.
    // the save button in general will read all properties
  },

  updatePendingKey(event){
    this.setState({pendingKey: event.target.value});
  },

  updatePendingValue(event){
    this.setState({pendingValue: event.target.value});
  },

  addDataProperty(event){
    event.preventDefault();
    if(this.state.pendingKey === '' || this.state.pendingValue === ''){ return; }

    this.state.optionalProperties.push({
      id: this.state.pendingKey,
      value: this.state.pendingValue,
      requried: 'no'
    });

    this.setState({
      optionalProperties: this.state.optionalProperties,
      pendingKey: '',
      pendingValue: '',
    });
  },

  removeOptionalProperty(event){
    let newOptionalProperties = [];
    this.state.optionalProperties.forEach(function(op){
      if(op.id !== event.target.id){
        newOptionalProperties.push(op);
      }
    });

    this.setState({optionalProperties: newOptionalProperties});
  },

  upload(){
    const client = this.props.client;

    let payload = {
      sync: true,
      createdAt: this.state.createdAt.getTime(),
      data:{}
    };

    this.state.topLevelProperties.forEach(function(collection){
      payload[collection.id] = collection.value;
    });

    this.state.optionalProperties.forEach(function(collection){
      payload.data[collection.id] = collection.value;
    });

    client.action(payload, '/api/' + this.props.recordType, 'POST', (data) => {
      window.location.href = `/#/${this.props.recordType}/${data.guid}`;
    });
  },

  render(){
    return(
      <Row>
        <Col md={12}>
          <h1>New { WordHelper.titleize(this.props.recordType) }</h1>
        </Col>

        <Col md={6}>
          <h2>Top-Level Properties</h2>

          <FormGroup>
            <ControlLabel>Created At</ControlLabel>
            <Datetime value={this.state.createdAt} onChange={this.updateCreatedAt} />
          </FormGroup>

          <LazyTable
            objects={this.state.topLevelProperties}
            idName={'Key'}
            inlineEdit={{ value: this.handlePropEditNoOP }}
          />
        </Col>

        <Col md={6}>
          <h2>Data Properties</h2>

            <LazyTable
              objects={this.state.optionalProperties}
              idName={'Key'}
              inlineEdit={{ value: this.handlePropEditNoOP }}
              destroy={this.removeOptionalProperty}
            />

            <hr />
            <h3>Add New:</h3>

            <Form horizontal onSubmit={this.addDataProperty}>
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
                  <Button type="submit">Add Data Property</Button>
                </Col>
              </FormGroup>
            </Form>
        </Col>

        <Col md={12}>
          <hr />
          <FormGroup>
            <Button onClick={this.upload} type="submit">Create New Record</Button>
          </FormGroup>
        </Col>

      </Row>
    );
  }
});

export default RecordNew;
