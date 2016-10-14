import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import HeatmapLayer from 'react-leaflet-heatmap-layer';
import WordHelper from './../wordHelper.jsx';

const HeatMap = React.createClass({

  // requires:
  // `this.props.section`: The name of the thing we are reasoning about (people, messages, etc)
  // `this.props.client`: ActionHero Client
  // `this.props.query`: search query (optional)
  // `this.props.size` (defalut 10000)

  getInitialState(){
    return {
      size: (this.props.size || 10000),
      query: this.props.query,
      points: []
    };
  },

  componentDidMount: function(){
    this.loadHeatmap();
  },

  componentWillReceiveProps: function(newProps){
    if(newProps.query && this.state.query !== newProps.query){
      this.setState({query: newProps.query}, () => {
        this.loadHeatmap();
      });
    }
  },

  loadHeatmap: function(){
    let client = this.props.client;
    let searchKeys = ['location'];
    let searchValues = ['_exists'];

    if(this.state.query === ''){ return; }
    if(this.state.query){
      [searchKeys, searchValues] = WordHelper.routeQueryToParams(this.state.query);
      searchKeys.push('location');
      searchValues.push('_exists');
    }

    client.action({
      searchKeys: searchKeys,
      searchValues: searchValues,
      from: 0,
      size: this.state.size,
    }, '/api/' + this.props.section + '/search', 'GET', (data) => {
      let points = [];
      data[this.props.section].forEach(function(e){
        points.push([e.location.lat, e.location.lon]);
      });

      this.setState({points: points});
    });
  },

  render(){
    if(this.state.query === ''){ return null; }
    if(this.state.points.length === 0){ return null; }

    return(
      <Row>
        <Col md={12}>
          <h2>Heatmap</h2>
        </Col>

        <Col md={12}>
          <Map
            style={{height: '300px', width: '100%'}}
            center={[0, 0]}
            zoom={6}
          >
          <HeatmapLayer
              fitBoundsOnLoad
              fitBoundsOnUpdate
              points={this.state.points}
              longitudeExtractor={m => m[1]}
              latitudeExtractor={m => m[0]}
              intensityExtractor={m => 1000}
            />
            <TileLayer
              url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          </Map>
          <p>
            Showing the {this.state.points.length} most recent geo-located entries.
          </p>
        </Col>
      </Row>
    );
  }
});

export default HeatMap;
