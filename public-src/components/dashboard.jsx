import React from 'react';
import Moment from 'moment';
import ReactHighcharts from 'react-highcharts';
import { Row, Col, FormGroup, ControlLabel, FormControl, Panel, Table, Glyphicon, Label } from 'react-bootstrap';
import LazyTable from './utils/lazyTable.jsx';

const Dashboard = React.createClass({
  getInitialState: function(){
    return {
      status: false,
      stats: {},
      timer: null,
      campaigns: [],
      campaignFunnels: {},
      ranges: {
        'Today':      {start: (Moment().startOf('day')),   end: Moment()},
        'This Week':  {start: (Moment().startOf('week')),  end: Moment()},
        'This Month': {start: (Moment().startOf('month')), end: Moment()},
        'This Year':  {start: (Moment().startOf('year')),  end: Moment()},
      },
      sections: ['people', 'events', 'messages'],
      timingOptions: {
        '5': '5s',
        '30': '30s',
        '60': '60s',
      },
      refreshInterval: '60',
    };
  },

  tick: function(){
    clearTimeout(this.state.timer);
    let sleep = parseInt(this.state.refreshInterval) * 1000;
    let timer = setTimeout(() => {
      this.setState({
        ranges: {
          'Today':      {start: (Moment().startOf('day')),   end: Moment()},
          'This Week':  {start: (Moment().startOf('week')),  end: Moment()},
          'This Month': {start: (Moment().startOf('month')), end: Moment()},
          'This Year':  {start: (Moment().startOf('year')),  end: Moment()},
        }
      }, () => {
        this.loadStatus();
        this.loadStats();
        this.loadCampaigns();
        this.loadHistogram();
        this.tick();
      });
    }, sleep);

    this.setState({timer: timer});
  },

  componentDidMount: function(){
    this.loadStatus();
    this.loadStats();
    this.loadCampaigns();
    // this.loadHistogram(); // handled by chart rendering callback

    this.tick();
  },

  componentWillUnmount: function(){
    clearTimeout(this.state.timer);
  },

  loadStatus: function(){
    const client = this.props.client;
    client.action({}, '/api/system/status', 'GET', (data) => {
      this.setState({status: data});
    });
  },

  loadStats: function(){
    const client = this.props.client;

    this.state.sections.forEach((section) => {
      Object.keys(this.state.ranges).forEach((range) => {
        client.action({
          maximumSelections: 0,
          selections: [],
          searchKeys: ['guid'],
          searchValues: ['_exists'],
          interval: 'year',
          start: this.state.ranges[range].start.valueOf(),
          end: this.state.ranges[range].end.valueOf(),
        }, '/api/' + section + '/aggregation', 'GET', (data) => {
          let value = 0;
          if(data.aggregations._all.length > 0){
            value = data.aggregations._all[0].doc_count;
          }

          if(!this.state.stats[range]){ this.state.stats[range] = {}; }
          this.state.stats[range][section] = value;
          this.setState({stats: this.state.stats});
        });
      });
    });
  },

  loadHistorgramSection: function(section){
    const client = this.props.client;
    const start  = (new Date(new Date().getTime() - (1000 * 60 * 60)).getTime());
    const end    = (new Date().getTime());
    const chart  = this.refs.chart.getChart();

    client.action({
      maximumSelections: 0,
      selections: [],
      searchKeys: ['guid'],
      searchValues: ['_exists'],
      interval: 'minute',
      start: start,
      end: end,
    }, '/api/' + section + '/aggregation', 'GET', function(data){
      if(!chart.series){ return; }
      chart.series.forEach(function(series){
        if(series.name === section){
          let seriesData = [];
          data.aggregations._all.forEach(function(e){
            seriesData.push([e.key, e.doc_count]);
          });

          series.update({data: seriesData});
        }
      });
    });
  },

  loadHistogram: function(){
    // sleep to allow this.refs to propigate from chart
    setTimeout(() => {
      this.state.sections.forEach((section) => {
        this.loadHistorgramSection(section);
      });
    }, 0);
  },

  handleRefreshIntervalChange: function(event){
    this.setState({refreshInterval: event.target.value}, () => {
      this.tick(this);
    });
  },

  loadCampaigns: function(){
    const client = this.props.client;
    client.action({
      from: 0,
      size: 20,
      sent: true,
    }, '/api/campaigns', 'GET', (data) => {
      this.setState({campaigns: data.campaigns});
      data.campaigns.forEach((campaign) => {
        this.loadCampaignStats(campaign);
      });
    });
  },

  loadCampaignStats: function(campaign){
    const client = this.props.client;

    client.action({
      campaignId: campaign.id,
      interval: 'year',
      start: new Date(0).getTime(),
      end: new Date().getTime(),
    }, '/api/campaign/stats', 'GET', (data) => {
      let safeDivisor = data.totals.sentAt;
      if(data.totals.sentAt === 0){ safeDivisor = Infinity; }

      this.state.campaignFunnels[campaign.id] = data;
      this.state.campaignFunnels[campaign.id].rates = {
        sentAt: Math.round(data.totals.sentAt / safeDivisor * 10000) / 100,
        readAt: Math.round(data.totals.readAt / safeDivisor * 10000) / 100,
        actedAt: Math.round(data.totals.actedAt / safeDivisor * 10000) / 100,
      };

      this.setState({campaignFunnels: this.state.campaignFunnels});
    });
  },

  render: function(){
    const status = this.state.status;
    let index = 0;

    let series = [];
    this.state.sections.forEach((section) => {
      series.push({
        name: section,
        data: [],
      });
    });

    const chartConfig = {
      global: { useUTC: false },
      credits: { enabled: false },
      chart: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        type: 'spline',
        // events: {
        //   load: function(){ $scope.chart = this; }
        // }
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
      series: series
    };

    if(!status){
      return <em>loading...</em>;
    }

    return(
      <div>

        <Col md={12}>
          <h1>
            <strong>{ status.node.team.name }</strong> {'@'} { status.node.team.trackingDomain }
          </h1>

          <FormGroup controlId={this.refreshInterval}>
            <span className="text-info">MessageBot Version { status.node.version } | </span>
            <ControlLabel>{'Refresh Interval:'}</ControlLabel>
            <select value={this.state.refreshInterval} onChange={this.handleRefreshIntervalChange}>
              {
                Object.keys(this.state.timingOptions).map((optKey) => {
                  return <option key={optKey} value={optKey}>{this.state.timingOptions[optKey]}</option>;
                })
              }
            </select>
          </FormGroup>
        </Col>

        <Col md={12}> <hr /> </Col>

        <Col md={12}>
          <h2>Realtime</h2>
          <ReactHighcharts
            ref="chart"
            config={chartConfig}
            callback={this.loadHistogram}
            domProps={{
              style: {
                minWidth: '310px',
                height: '300px',
                margin: '0'
              }
            }
          }/>
        </Col>

        <Col md={12}> <hr /> </Col>

        <Col md={12}>
          <h2>Tracking</h2>
        </Col>

        <Col md={12}>
          {
            Object.keys(this.state.ranges).map((rangeKey) => {
              index++;
              let range = this.state.ranges[rangeKey];
              return(
                <_RangeCountBox
                key={index}
                stats={this.state.stats}
                sections={this.state.sections}
                index={index}
                rangeKey={rangeKey}
                />
              );
            })
          }
        </Col>

        <Col md={12}> <hr /> </Col>

        <Col md={12}>
          <h2>Sent Campaigns</h2>
        </Col>

        <Col md={12}>
          <Table striped bordered condensed hover responsive>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Sent At</th>
                <th>Total Messages</th>
                <th>Type</th>
                <th>Transport</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.campaigns.map((campaign) => {
                  return(
                    <_CampaignStatsRow key={campaign.id} campaign={campaign} campaignFunnels={this.state.campaignFunnels} />
                  );
                })
              }
            </tbody>
          </Table>
      </Col>

      </div>
    );
  },
});

const _CampaignStatsRow = React.createClass({
  render: function(){
    let campaign = this.props.campaign;
    let campaignFunnel = this.props.campaignFunnels[campaign.id] || {rates: {}, totals: {}};

    return(
      <tr>
        <td><a href={`/#/campaign/${campaign.id}/stats`}><Glyphicon glyph="signal"/></a></td>
        <td><strong>{ campaign.name }</strong></td>
        <td>{ Moment(campaign.sentAt).fromNow() }</td>
        <td>{ campaignFunnel.totals.sentAt }</td>
        <td>{ campaign.type }</td>
        <td>{ campaign.transport }</td>
        <td>
          <p>
            <strong><span>Conversion Rate: <span className="badge">{ campaignFunnel.rates.actedAt }%</span></span></strong>
          </p>
          <p>
            <Label bsStyle="danger">{ campaignFunnel.totals.sentAt } Sent</Label> <Label bsStyle="info">{ campaignFunnel.totals.readAt } Read</Label> <Label bsStyle="success">{ campaignFunnel.totals.actedAt } Acted</Label>
          </p>
        </td>
      </tr>
    );
  }
});

const _RangeCountBox = React.createClass({
  render: function(){
    let width = 4;
    let style = 'default';
    if(this.props.index === 1){ width = 12; style = 'info'; }

    return(
      <Col md={width}>
        <Panel bsStyle={style} header={<h3> {this.props.rangeKey} </h3>}>
          <Row>
            {
              this.props.sections.map((section) => {
                let value = 0;
                if(this.props.stats[this.props.rangeKey] && this.props.stats[this.props.rangeKey][section]){
                  value = this.props.stats[this.props.rangeKey][section];
                }

                return(
                  <Col md={4} key={`${section}-${this.props.index}`}>
                    <Panel footer={section} className={'text-center'}>
                      <div className={'text-center'}>
                        <h5>{ value }</h5>
                      </div>
                    </Panel>
                </Col>
              );
              })
            }
          </Row>
        </Panel>
      </Col>
    );
  }
});

export default Dashboard;
