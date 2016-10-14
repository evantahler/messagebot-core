import React from 'react';
import { Panel, FormGroup, ControlLabel, FormControl, Button, Glyphicon } from 'react-bootstrap';

const SessionDestroy = React.createClass({

  logOut(){
    const client = this.props.client;
    client.action({}, '/api/session', 'DELETE', function(data){
      window.location.reload();
    });
  },

  processForm(event){
    event.preventDefault();
    this.logOut();
  },

  componentDidMount(){
    this.logOut();
  },

  render(){
    return(
      <Panel header={<h3>Log Out</h3>}>
        <form onSubmit={ this.processForm }>
          <Button type="submit" bsStyle="warning"><Glyphicon glyph="flash" /> Log Out</Button>
        </form>
      </Panel>
    );
  }
});

export default SessionDestroy;
