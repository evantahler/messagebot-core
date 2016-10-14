import React from 'react';
import { Row, Col, Button, Form, FormGroup, ControlLabel, FormControl, Alert } from 'react-bootstrap';
import Moment from 'moment';
import Datetime from 'react-datetime';
import ReactHighcharts from 'react-highcharts';
import LazyIframe from './../utils/lazyIframe.jsx';
import StackedHistogram from './../utils/stackedHistogram.jsx';

const CampaignStats = React.createClass({
  getInitialState(){
    return {
      list: {},
      lists: [],
      templates: [],
      template: {},
      transports: [],
      transport: {},
      funnel: {},
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
    this.loadCampaignStats();
    this.loadTemplates();
    this.loadLists();
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

  loadCampaignStats(){
    const client = this.props.client;

    client.action({
      campaignId: this.state.campaignId,
      interval: 'day',
      start: new Date(0).getTime(),
      end: new Date().getTime(),
    }, '/api/campaign/stats', 'GET', (data) => {
      let safeDivisor = data.totals.sentAt;
      if(data.totals.sentAt === 0){ safeDivisor = Infinity; }

      let funnel = data;
      funnel.rates = {
        sentAt: Math.round(data.totals.sentAt / safeDivisor * 10000) / 100,
        readAt: Math.round(data.totals.readAt / safeDivisor * 10000) / 100,
        actedAt: Math.round(data.totals.actedAt / safeDivisor * 10000) / 100,
      };

      this.setState({funnel: funnel});
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

  changePersonGuid(event){
    this.setState({personGuid: event.target.value});
  },

  render(){
    if(!this.state.campaign){ return null; }
    if(!this.state.list){ return null; }
    if(!this.state.transport){ return null; }
    if(!this.state.template){ return null; }
    if(!this.state.funnel.sentAt){ return null; }

    let sentAtSeries  = [];
    let readAtSeries  = [];
    let actedAtSeries = [];

    this.state.funnel.sentAt.forEach(function(e){
      sentAtSeries.push({x: new Date(e.key), y: e.doc_count});
    });
    this.state.funnel.readAt.forEach(function(e){
      readAtSeries.push({x: new Date(e.key), y: e.doc_count});
    });
    this.state.funnel.actedAt.forEach(function(e){
      actedAtSeries.push({x: new Date(e.key), y: e.doc_count});
    });

    const chartConfig = {
      global: { useUTC: false },
      credits: { enabled: false },
      chart: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        type: 'spline',
      },
      title: false,
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 150
      },
      yAxis: {
        title: { text: 'Created At' },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        floating: true,
      },
      series: [
        {name: 'sent messages', data: sentAtSeries, color: 'orange'},
        {name: 'read messages', data: readAtSeries, color: 'blue'},
        {name: 'acted messages', data: actedAtSeries, color: 'green'},
      ]
    };

    return(
      <Row>
        <Col md={12}>
          <h1>Campaign Stats: {this.state.campaign.name}</h1>
          <p>{this.state.campaign.description}</p>
          <h3 className="text-success">Sent At: {Moment(this.state.campaign.sentAt).fromNow()}</h3>
        </Col>

        <Col md={4}>
          <h2>Funnel:</h2>

          <Alert bsStyle="warning">
            <h4 className="text-success">Sent: {this.state.funnel.totals.sentAt}</h4>
            <em>{this.state.funnel.rates.sentAt}%</em>
          </Alert>

          <h1>&#x21A1;</h1>

          <Alert bsStyle="info">
            <h4 className="text-success">Read: {this.state.funnel.totals.readAt}</h4>
            <em>{this.state.funnel.rates.readAt}%</em>
          </Alert>

          <h1>&#x21A1;</h1>

          <Alert bsStyle="success">
            <h4 className="text-success">Acted: {this.state.funnel.totals.actedAt}</h4>
            <em>{this.state.funnel.rates.actedAt}%</em>
          </Alert>

        </Col>

        <Col md={8}>
          <h2>Preview</h2>
          <p>personGuid: <input type="text" value={this.state.personGuid || ''} onChange={this.changePersonGuid} /></p>
          <hr />
          <LazyIframe body={this.state.render || ''} />
        </Col>

        <Col md={12}>
          <h2>Campaign Events</h2>
          <p><em>Only one type of event per message is counted; most recent multiple is reported</em></p>

          <ReactHighcharts
            ref="chart"
            config={chartConfig}
            domProps={{
              style: {
                minWidth: '310px',
                height: '300px',
                margin: '0'
              }
            }
          }/>
      </Col>

        <Col md={12}>
          <StackedHistogram
            section="messages"
            client={this.props.client}
            query={`campaignId:${this.state.campaignId}`}
            start={new Date(0)}
          />
        </Col>

      </Row>
    );
  }
});

export default CampaignStats;
