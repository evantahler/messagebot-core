import React from 'react';
import { Panel } from 'react-bootstrap';

const SessionForgot = React.createClass({
  render(){
    return(
      <Panel header={<h3>Need Help Logging In?</h3>}>
        <p>Contact an Administrator</p>
      </Panel>
    );
  }
});

export default SessionForgot;
