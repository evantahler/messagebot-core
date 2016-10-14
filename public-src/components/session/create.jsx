import React from 'react';
import { Panel, FormGroup, ControlLabel, FormControl, Button, Glyphicon } from 'react-bootstrap';

const SessionCreate = React.createClass({
  getInitialState(){
    return {
      email: '',
      password: '',
    };
  },

  processForm(event){
    event.preventDefault();

    const client = this.props.client;
    client.action(this.state, '/api/session', 'POST', function(data){
      document.location.href = '/#/dashboard';
      window.location.reload();
    });
  },

  handleChange(event){
    let change = {};
    change[event.target.id] = event.target.value;
    this.setState(change);
  },

  render(){
    return(
      <Panel header={<h3>Log In</h3>}>
        <form onSubmit={ this.processForm }>

          <FormGroup controlId="email">
            <ControlLabel>Email Address</ControlLabel>
            <FormControl value={this.state.email} onChange={this.handleChange} type="text" placeholder="you@site.com" />
          </FormGroup>

          <FormGroup controlId="password">
            <ControlLabel>Password</ControlLabel>
            <FormControl value={this.state.password} onChange={this.handleChange} type="password" placeholder="" />
          </FormGroup>

          <Button type="submit" bsStyle="success"><Glyphicon glyph="flash" /> Submit</Button>

        </form>
      </Panel>
    );
  }
});

export default SessionCreate;
