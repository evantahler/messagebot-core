import React from 'react';
import { Row, Col, FormGroup, ControlLabel, FormControl, Checkbox, Well } from 'react-bootstrap';
import ReactHighcharts from 'react-highcharts';
import Datetime from 'react-datetime';
import WordHelper from './../utils/wordHelper.jsx';

const StackedHistogram = React.createClass({

  // requires:
  // `this.props.section`: The name of the thing we are reasoning about (people, messages, etc)
  // `this.props.client`: ActionHero Client
  // `this.props.query`: search query (optional)
  // `this.props.maximumSelections` (defalut 10)
  // `this.props.start` (defalut "1 month ago")
  // `this.props.end` (defalut "now")
  // `this.props.selections` (defalut "none")

  getInitialState(){
    return {
      maximumSelections: (this.props.maximumSelections || 10),
      possibleIntervals: ['year', 'month', 'week', 'day', 'hour'],
      interval: 'day',
      start: (this.props.start || new Date(new Date().setMonth(new Date().getMonth() - 1))),
      end: (this.props.end || new Date()),
      query: this.props.query,
      selections: (this.props.selections || {}),
      config: {},
    };
  },

  componentDidMount: function(){
    this.loadHistogram();
  },

  componentWillReceiveProps: function(newProps){
    if(newProps.query && this.state.query !== newProps.query){
      this.setState({
        query: newProps.query,
        selections: {},
      }, () => {
        this.loadHistogram();
      });
    }
  },

  updateHistogramRange: function(event){
    this.setState({interval: event.target.value}, () => {
      this.loadHistogram();
    });

  },

  updateHistogramStart: function(date){
    this.setState({start: date.toDate()}, () => {
      this.loadHistogram();
    });
  },

  updateHistogramEnd: function(date){
    this.setState({end: date.toDate()}, () => {
      this.loadHistogram();
    });
  },

  handleSlectionClick: function(event){
    this.state.selections[event.target.name] = event.target.checked;
    this.setState({selections: this.state.selections}, () => {
      this.loadHistogram();
    });
  },

  loadHistogram: function(){
    const client = this.props.client;
    let searchKeys = ['guid'];
    let searchValues = ['_exists'];

    if(this.state.query === ''){ return; }
    if(this.state.query){
      [searchKeys, searchValues] = WordHelper.routeQueryToParams(this.state.query);
    }

    let selections = [];
    Object.keys(this.state.selections).forEach((k) => {
      if(this.state.selections[k] === true){ selections.push(k); }
    });

    client.action({
      maximumSelections: this.state.maximumSelections,
      selections: selections,
      searchKeys: searchKeys,
      searchValues: searchValues,
      interval: this.state.interval,
      start: this.state.start.getTime(),
      end: this.state.end.getTime(),
    }, '/api/' + this.props.section + '/aggregation', 'GET', (data) => {
      this.state.selectionsName = data.selectionsName;
      data.selections.forEach((aggName) => {
        this.state.selections[aggName] = false;
      });

      let series = [];
      Object.keys(data.aggregations).forEach((aggName) => {
        let seriesData;
        if(aggName !== '_all'){
          seriesData = {
            name: aggName,
            type: 'column',
            data: []
          };

          this.state.selections[aggName] = true;
        }else{
          seriesData = {
            name: '*Total',
            type: 'spline',
            dashStyle: 'LongDash',
            lineWidth: 4,
            color: '#CCCCCC',
            data: []
          };
        }

        data.aggregations[aggName].forEach(function(e){
          seriesData.data.push({x: new Date(e.key), y: e.doc_count});
        });

        series.push(seriesData);
      });

      const config = {
        global: { useUTC: false },
        credits: { enabled: false },
        chart: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        plotOptions: {
          column: {
            stacking: 'normal',
          }
        },
        title: {
          text: this.props.section,
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
          tickPixelInterval: 150
        },
        yAxis: {
          title: { text: (this.props.section + ' created') },
          stackLabels: {
            enabled: true,
            style: {
              fontWeight: 'bold',
              color: 'gray'
            }
          }
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          floating: true,
        },
        series: series
      };

      this.setState({
        config: config,
        selections: this.state.selections,
      });
    });
  },

  render(){
    if(this.state.query === ''){ return null; }
    if(Object.keys(this.state.selections).length === 0){ return null; }

    return(
      <div>
        <h2>Histogram:</h2>

        <Row>
          <Col md={2}>
            <FormGroup>
              <ControlLabel>Interval</ControlLabel>
              <FormControl onChange={this.updateHistogramRange} value={this.state.interval} componentClass="select">
                {
                  this.state.possibleIntervals.map((i) => {
                    return <option key={i} value={i}>{ WordHelper.titleize(i) }</option>;
                  })
                }
              </FormControl>
            </FormGroup>
          </Col>

          <Col md={5}>
            <FormGroup>
              <ControlLabel>Start</ControlLabel>
              <Datetime value={this.state.start} onChange={this.updateHistogramStart} />
            </FormGroup>
          </Col>

          <Col md={5}>
            <FormGroup>
              <ControlLabel>End</ControlLabel>
              <Datetime value={this.state.end} onChange={this.updateHistogramEnd} />
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={3}>
            <Well bsSize="small">
              <h4>Possible { this.state.selectionsName }:</h4>
                {
                  Object.keys(this.state.selections).map((selection) => {
                    const checked = this.state.selections[selection];
                    return(
                      <div key={selection}>
                        <label>
                          <Checkbox name={selection} onChange={this.handleSlectionClick} checked={checked}>{selection}</Checkbox>
                        </label>
                      </div>
                    );
                  })
                }
            </Well>
          </Col>

          <Col md={9}>
            <ReactHighcharts
              isPureConfig={true}
              ref="histogramChart"
              config={this.state.config}
              domProps={{
                style: {
                  minWidth: '310px',
                  height: '300px',
                  margin: '0'
                }
              }
            } />
          </Col>
        </Row>
      </div>
    );
  }
});

export default StackedHistogram;
