import React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import LazyTable from '../utils/lazyTable.jsx';
import LazyEditModal from '../utils/lazyEditModal.jsx';

const UsersList = React.createClass({
  processUserAddForm(event){
    event.preventDefault();
    const client = this.props.client;
    client.action(this.state.user, '/api/user', 'POST', (data) => {
      client.notify('Created', 'success');
      this.hideUserAddModal();
      this.loadUsers();
    });
  },

  processUserDelete(event){
    const client = this.props.client;
    if(confirm('Are you Sure?')){
      client.action({userId: event.target.id}, '/api/user', 'DELETE', (data) => {
        client.notify('User Deleted', 'success');
        this.loadUsers();
      });
    }
  },

  processUserEditForm(event){
    event.preventDefault();
    const client = this.props.client;
    this.state.user.userId = this.state.user.id;
    client.action(this.state.user, '/api/user', 'PUT', (data) => {
      client.notify('Updated', 'success');
      this.hideUserEditModal();
      this.loadUsers();
    });
  },

  getInitialState: function(){
    return {
      users: [],
      roles: [],
      user: {}, // this will hold the or edditing user in question
      userAddModal: false,
      userEditModal: false,
    };
  },

  componentDidMount: function(){
    this.loadUsers();
    this.loadRoles();
  },

  showUserAddModal(){
    this.setState({ user: {} });
    this.setState({ userAddModal: true });
  },

  showUserEditModal(event){
    let user = null;
    this.state.users.forEach(function(u){
      if(u.id === parseInt(event.target.id)){ user = u; }
    });

    this.setState({ userEditModal: true });
    this.setState({ user: user });
  },

  hideUserAddModal(){
    this.setState({ userAddModal: false });
  },

  hideUserEditModal(){
    this.setState({ userEditModal: false });
  },

  loadRoles(){
    const client = this.props.client;
    client.action({}, '/api/users/roles', 'GET', (data) => {
      this.setState({roles: data.roles});
    });
  },

  loadUsers(){
    const client = this.props.client;
    client.action({}, '/api/users', 'GET', (data) => {
      this.setState({users: data.users});
    });
  },

  render(){
    return(
      <div>
        <h1>Users</h1>

        <LazyEditModal
          title={'Add User'}
          object={this.state.user}
          show={this.state.userAddModal}
          onHide={this.hideUserAddModal}
          onSubmit={this.processUserAddForm}
          extraKeys={[
            'email',
            'firstName',
            'lastName',
            'role',
            'password'
          ]}
          ignoredKeys={[]}
          types={{
            password: 'password'
          }}
          options={{
            role: this.state.roles
          }}
        />

        <LazyEditModal
          title={'Edit User'}
          object={this.state.user}
          show={this.state.userEditModal}
          onHide={this.hideUserEditModal}
          onSubmit={this.processUserEditForm}
          extraKeys={['password']}
          ignoredKeys={[]}
          types={{
            password: 'password'
          }}
          options={{
            role: this.state.roles
          }}
        />

        <LazyTable
          objects={this.state.users}
          edit={this.showUserEditModal}
          destroy={this.processUserDelete}
          ignoredKeys={[]}
        />

        <Button bsStyle="primary" onClick={this.showUserAddModal}>Create User</Button>
      </div>
    );
  }
});

export default UsersList;
