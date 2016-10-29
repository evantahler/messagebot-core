import React from 'react';
import LazyEditPanel from '../utils/lazyEditPanel.jsx';

const UserEdit = React.createClass({
  getInitialState: function(){
    return {
      user: this.props.user || {},
      roles: [],
    };
  },

  processForm(event){
    event.preventDefault();
    const client = this.props.client;
    client.action(this.state.user, '/api/user', 'PUT', (data) => {
      this.state.user = data.user;
      client.notify('Updated', 'success');
    });
  },

  componentDidMount: function(){
    this.loadRoles();
  },

  loadRoles(){
    const client = this.props.client;
    client.action({}, '/api/users/roles', 'GET', (data) => {
      this.setState({roles: data.roles});
    });
  },

  componentWillReceiveProps(nextProps){
    this.setState({user: nextProps.user});
  },

  render(){
    return(
      <div>
        <h1>Account Settings</h1>

        <LazyEditPanel
          title={'Edit User'}
          object={this.state.user}
          onSubmit={this.processForm}
          extraKeys={['password']}
          ignoredKeys={[]}
          types={{
            password: 'password'
          }}
          options={{
            role: this.state.roles
          }}
        />
      </div>
    );
  }
});

export default UserEdit;
