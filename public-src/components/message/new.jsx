import React from 'react';
import RecordNew from './../utils/recordNew.jsx';

const PersonNew = React.createClass({
  getInitialState(){
    return {
      recordType: 'message',
    };
  },

  render(){
    return(
      <RecordNew
        client={this.props.client}
        recordType={this.state.recordType}
      />
    );
  }
});

export default PersonNew;
