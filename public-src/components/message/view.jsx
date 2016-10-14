import React from 'react';
import RecordView from './../utils/recordView.jsx';

const PersonView = React.createClass({
  getInitialState(){
    return {
      guid: this.props.params.guid,
      recordType: 'message',
    };
  },

  render(){
    return(
      <RecordView
        recordType={this.state.recordType}
        guid={this.state.guid}
        client={this.props.client}
      />
  );
  }
});

export default PersonView;
