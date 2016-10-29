import React from 'react';
import RecordsList from './../utils/recordsList.jsx';
import HeatMap from './../utils/maps/heatMap.jsx';
import StackedHistogram from './../utils/stackedHistogram.jsx';

const PeopleRecent = React.createClass({
  getInitialState(){
    return {
      section: 'people',
    };
  },

  render(){
    return(
      <div>
        <h1>People</h1>

        <StackedHistogram
          section={this.state.section}
          client={this.props.client}
        />

        <HeatMap
          section={this.state.section}
          client={this.props.client}
        />

        <RecordsList
          section={this.state.section}
          client={this.props.client}
          params={this.props.params}
          location={this.props.location}
        />
      </div>
    );
  }
});

export default PeopleRecent;
