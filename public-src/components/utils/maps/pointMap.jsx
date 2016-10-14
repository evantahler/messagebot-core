import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

const PointMap = React.createClass({

  // requires:
  // `this.props.section`: The name of the thing we are reasoning about (people, messages, etc)
  // `this.props.points`: array of points to draw (or you can use `this.props.point` to pass one point in)
  //    Each point has:
  //    lat, lng, name

  getInitialState(){
    return {
      points: (this.props.points || [])
    };
  },

  componentWillReceiveProps(newProps){
    if(newProps.point){
      let point = {
        lat: newProps.point.lat,
        lng: newProps.point.lng || newProps.point.lon,
        name: newProps.point.name || newProps.name || 'point',
      };

      this.setState({points: [point]});
    }

    else if(newProps.points){
      this.setState({points: newProps.points});
    }
  },

  render(){
    if(this.state.points.length === 0){ return null; }
    if(!this.state.points[0].lat && !this.state.points[0].lat){ return null; }

    let counter = 0;
    let latTotal = 0;
    let lngTotal = 0;
    this.state.points.forEach(function(point){
      latTotal += point.lat;
      lngTotal += point.lng;
    });

    const middle = [
      (latTotal / this.state.points.length),
      (lngTotal / this.state.points.length)
    ];

    return(
      <Row>
        <Col md={12}>
          <h2>Map</h2>
        </Col>

        <Col md={12}>
          <Map
            style={{height: '300px', width: '100%'}}
            center={middle}
            zoom={6}
          >
            <TileLayer
              url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          {
            this.state.points.map(function(point){
              counter++;
              return(
                <Marker key={counter} position={[point.lat, point.lng]} ref={counter}>
                  <Popup>
                    <span>{point.name}</span>
                  </Popup>
                </Marker>
              );
            })
          }
          </Map>
        </Col>
      </Row>
    );
  }
});

export default PointMap;
