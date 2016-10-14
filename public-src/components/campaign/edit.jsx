import React from 'react';
import { Row, Col, Button, Form, FormGroup, ControlLabel, FormControl, Alert } from 'react-bootstrap';
import Moment from 'moment';
import Datetime from 'react-datetime';
import LazyTable from './../utils/lazyTable.jsx';
import LazyIframe from './../utils/lazyIframe.jsx';

const CampaignEdit = React.createClass({
  getInitialState(){
    return {
      list: null,
      lists: [],
      templates: [],
      template: {},
      transports: [],
      transport: {},
      types: [],
      campaignVariables: [],
      personGuid: this.props.user.personGuid,
      campaignId: (this.props.params.campaignId),
    };
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.user){
      this.setState({personGuid: nextProps.user.personGuid}, () => {
        this.loadView();
      });
    }
  },

  componentWillMount(){
    this.loadCampaign();
    this.loadTemplates();
    this.loadLists();
    this.loadTypes();
    this.loadTransports();
  },

  loadCampaign(){
    const client = this.props.client;

    client.action({campaignId: this.state.campaignId}, '/api/campaign', 'GET', (data) => {
      let campaign = data.campaign;

      if(campaign.createdAt){ campaign.createdAt = Moment(new Date(Date.parse(campaign.createdAt))).fromNow(); }
      if(campaign.updatedAt){ campaign.updatedAt = Moment(new Date(Date.parse(campaign.updatedAt))).fromNow(); }
      if(campaign.sendAt){ campaign.sendAt = new Date(Date.parse(campaign.sendAt)); }

      this.setState({campaign: campaign}, () => { this.hydrateCampaign(); });
    });
  },

  hydrateCampaign(){
    let campaign = this.state.campaign;

    this.state.lists.forEach((list) => {
      if(list.id === campaign.listId){ this.setState({list: list}); }
    });

    this.state.templates.forEach((template) => {
      if(template.id === campaign.templateId){
        this.setState({template: template}, () => {
          this.loadView();
        });
      }
    });

    this.state.transports.forEach((transport) => {
      if(transport.name === campaign.transport){
        let campaignVariables = [];

        transport.campaignVariables.forEach((v) => {
          let value = campaign.campaignVariables[v];
          if(!value){ value = ''; }
          campaignVariables.push({ id: v, value: value });
        });

        this.setState({
          transport: transport,
          campaignVariables: campaignVariables
        });
      }
    });
  },

  loadTemplates(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/templates', 'GET', (data) => {
      this.setState({templates: data.templates}, () => {
        this.loadList();
        this.hydrateCampaign();
      });
    });
  },

  loadList(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({listId: this.state.campaign.listId}, '/api/list', 'GET', (data) => {
      this.setState({list: data.list});
    });
  },

  loadLists(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/lists', 'GET', (data) => {
      this.setState({lists: data.lists}, () => { this.hydrateCampaign(); });
    });
  },

  loadTypes(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/campaigns/types', 'GET', (data) => {
      this.setState({types: data.validTypes});
    });
  },

  loadTransports(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/transports', 'GET', (data) => {
      let transports = [];
      Object.keys(data.transports).forEach((transport) => {
        transports.push(data.transports[transport]);
      });

      this.setState({transports: transports});
    });
  },

  loadView(){
    const client = this.props.client;

    if(!this.state.personGuid){ return; }
    if(!this.state.template.id){ return; }

    let params = {
      templateId: this.state.template.id,
      personGuid: this.state.personGuid,
      trackBeacon: false,
    };

    let HTMLoptions = {
      credentials: 'include',
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(params)
    };

    const parent = this;
    fetch('/api/template/render.html', HTMLoptions).then((response) => {
      response.text().then((body) => {
        parent.setState({render: body});
      });
    }).catch(function(error){
      console.error(error);
    });
  },

  editCampaign(){
    const client = this.props.client;
    let campaign = this.state.campaign;
    campaign.campaignId = campaign.id;

    this.state.campaignVariables.forEach(function(cv){
      campaign.campaignVariables[cv.id] = cv.value;
    });

    if(campaign.sendAt){ campaign.sendAt = campaign.sendAt.getTime(); }
    if(campaign.campaignVariables){ campaign.campaignVariables = JSON.stringify(campaign.campaignVariables); }
    if(campaign.triggerEventMatch){ campaign.triggerEventMatch = JSON.stringify(campaign.triggerEventMatch); }

    client.action(campaign, '/api/campaign', 'PUT', (data) => {
      this.loadCampaign();
      client.notify('Campaign Updated', 'success');
    });
  },

  inlinePropChange(event){
    this.state.campaign[event.target.id] = event.target.value;
    this.setState({campaign: this.state.campaign}, () => {
      this.hydrateCampaign();
    });
  },

  updateSendAt(date){
    this.state.campaign.sendAt = date.toDate();
    this.setState({campaign: this.state.campaign});
  },

  changePersonGuid(event){
    this.setState({personGuid: event.target.value});
  },

  handleCampaignVarialbeChangeNoOp(){},

  render(){
    if(!this.state.campaign){ return null; }
    if(!this.state.list){ return null; }
    if(!this.state.transport){ return null; }
    if(!this.state.template){ return null; }

    return(
      <Row>
        <Col md={12}>
          <h1>Campaign: <input type="text" id="name" value={this.state.campaign.name} onChange={this.inlinePropChange}/></h1>
          {(() => {
            if(this.state.campaign.sentAt){
              return(
                  <Alert bsStyle="warning">
                    <h4 className="text-success">Sent At: { Moment(new Date(Date.parse(this.state.campaign.sentAt))).fromNow() }</h4>
                    <a href={`/#/campaign/${this.state.campaign.id}/stats`}>See Conversion Stats</a>
                  </Alert>
              );
            }
          })()}
          <p>
            Description: <input size="50" type="text" id="description" value={this.state.campaign.description} onChange={this.inlinePropChange} />
          </p>

          <p>
            This is a
            {' '}
            <select id="type" value={this.state.campaign.type} onChange={this.inlinePropChange}>
              {
                this.state.types.map((type) => {
                  return <option key={type} value={type}>{type}</option>;
                })
              }
            </select>
            {' '}
            {' '}
            <select id="transport" value={this.state.campaign.transport} onChange={this.inlinePropChange}>
              {
                this.state.transports.map((transport) => {
                  return <option key={transport.name} value={transport.name}>{transport.name}</option>;
                })
              }
            </select>
            {' '}
            campaign using the
            {' '}
            <select id="listId" value={this.state.campaign.listId} onChange={this.inlinePropChange} >
              {
                this.state.lists.map((list) => {
                  return <option key={list.id} value={list.id}>{list.folder} / {list.name}</option>;
                })
              }
            </select>
            {' '}
            list and
            {' '}
            <select id="templateId" value={this.state.campaign.templateId} onChange={this.inlinePropChange}>
              {
                this.state.templates.map((template) => {
                  return <option key={template.id} value={template.id}>{template.folder} / {template.name}</option>;
                })
              }
            </select>
            {' '}
            template.
          </p>

          <p>This list currently will send to {this.state.list.peopleCount} people</p>


          <a onClick={this.editCampaign} className="btn btn-primary">Save</a> <a onClick={this.deleteCampaign} className="btn btn-danger">Delete</a>
        </Col>

        <Col md={12}>
          <hr />
        </Col>

        <Col md={6}>
          <h2>Campaign Variables</h2>

          <LazyTable
            objects={this.state.campaignVariables}
            inlineEdit={{ value: this.handleCampaignVarialbeChangeNoOp }}
          />
        </Col>

        <Col md={6}>
          <h2>Options for a {this.state.campaign.type} campaign</h2>

          <Form horizontal>
            <FormGroup>
              <Col md={6}>
                <ControlLabel>Send At</ControlLabel>
              </Col>
              <Col md={6}>
                <Datetime value={this.state.campaign.sendAt} onChange={this.updateSendAt} />
              </Col>
            </FormGroup>
          </Form>

          <_RecurringCampaignOptions campaign={this.state.campaign} />
          <_TriggerCampaignOptions   campaign={this.state.campaign} />
        </Col>

        <Col md={12}>
          <hr />
        </Col>

        <Col md={12}>
          <h2>Preview</h2>
          <p>personGuid: <input type="text" value={this.state.personGuid || ''} onChange={this.changePersonGuid} /></p>
          <hr />
          <LazyIframe body={this.state.render || ''} />
        </Col>

      </Row>
    );
  }
});

const _RecurringCampaignOptions = React.createClass({
  getInitialState(){
    return {
      campaign: this.props.campaign,
    };
  },

  inlinePropChange(event){
    this.state.campaign[event.target.id] = event.target.value;
    this.setState({campaign: this.state.campaign});
  },

  render(){
    if(!this.state.campaign || this.state.campaign.type !== 'recurring'){ return null; }

    return(
      <Form horizontal>
        <FormGroup>
          <Col md={6}>
            <ControlLabel>Re-Send Delay (seconds)</ControlLabel>
          </Col>
          <Col md={6}>
            <FormControl id="reSendDelay" type="number" value={this.state.campaign.reSendDelay || 0} onChange={this.inlinePropChange} />
          </Col>
        </FormGroup>
      </Form>
    );
  }
});

const _TriggerCampaignOptions = React.createClass({
  getInitialState(){
    let triggerEventMatch = [];
    Object.keys(this.props.campaign.triggerEventMatch).forEach((key) => {
      triggerEventMatch.push({id: key, value: this.props.campaign.triggerEventMatch[key]});
    });

    return {
      campaign: this.props.campaign,
      triggerEventMatch: triggerEventMatch,
      pendingKey: '',
      pendingValue: '',
    };
  },

  updateCampaign(){
    this.state.campaign.triggerEventMatch = {};
    this.state.triggerEventMatch.forEach((tem) => {
      this.state.campaign.triggerEventMatch[tem.id] = tem.value;
    });

    this.setState({campaign: this.state.campaign});
  },

  inlinePropChange(event){
    this.state.campaign[event.target.id] = event.target.value;
    this.setState({campaign: this.state.campaign});
  },

  handleEdit(row){
    for(let i = 0; i < this.state.triggerEventMatch.length; i++){
      let tem = this.state.triggerEventMatch[i];
      if(tem.id === row.id){ this.state.triggerEventMatch[i].value = row.value; }
    }

    this.setState({triggerEventMatch: this.state.triggerEventMatch}, () => {
      this.updateCampaign();
    });
  },

  handleDestroy(event){
    for(let i = 0; i < this.state.triggerEventMatch.length; i++){
      let tem = this.state.triggerEventMatch[i];
      if(tem.id === event.target.id){ this.state.triggerEventMatch.splice(i, 1); }
    }

    this.setState({triggerEventMatch: this.state.triggerEventMatch}, () => {
      this.updateCampaign();
    });
  },

  updatePendingKey(event){
    this.setState({pendingKey: event.target.value});
  },

  updatePendingValue(event){
    this.setState({pendingValue: event.target.value});
  },

  addAttribute(){
    this.state.triggerEventMatch.push({id: this.state.pendingKey, value: this.state.pendingValue});
    this.setState({
      triggerEventMatch: this.state.triggerEventMatch,
      pendingKey: '',
      pendingValue: '',
    }, () => {
      this.updateCampaign();
    });
  },

  render(){
    if(!this.state.campaign || this.state.campaign.type !== 'trigger'){ return null; }

    return(
      <div>
        <Form horizontal>
          <FormGroup>
            <Col md={6}>
              <ControlLabel>Trigger-Send Delay (seconds)</ControlLabel>
            </Col>
            <Col md={6}>
              <FormControl id="triggerDelay" type="number" value={this.state.campaign.triggerDelay || 0} onChange={this.inlinePropChange} />
            </Col>
          </FormGroup>
        </Form>

        <hr />
        <h3>Event Triggers:</h3>

        <LazyTable
          objects={this.state.triggerEventMatch}
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

export default CampaignEdit;
