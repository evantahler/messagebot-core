import React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import LazyTable from '../utils/lazyTable.jsx';

const SystemSettings = React.createClass({

  getInitialState: function(){
    this.loadSettings();
    this.loadTransports();

    return {
      settings: [],
      transports: [],
    };
  },

  loadSettings(){
    const client = this.props.client;
    let settings = [];

    client.action({}, '/api/settings', 'GET', (data) => {
      Object.keys(data.settings).forEach((k) => {
        settings.push(data.settings[k]);
      });

      this.setState({settings: settings});
    });
  },

  loadTransports(){
    const client = this.props.client;
    let transports = [];

    client.action({}, '/api/transports', 'GET', (data) => {
      Object.keys(data.transports).forEach(function(k){
        transports.push(data.transports[k]);
      });

      this.setState({transports: transports});
    });
  },

  handleValueChange(setting){
    const client = this.props.client;

    client.action(setting, '/api/setting', 'PUT', (data) => {
      client.notify('Updated', 'success');
      this.loadSettings();
    });
  },

  render(){
    return(
      <div>
        <h1>Settings</h1>

        <h2>Settings</h2>
        <LazyTable
          objects={this.state.settings}
          ignoredKeys={['id', 'teamId', 'createdAt', 'updatedAt']}
          inlineEdit={{ value: this.handleValueChange }}
        />

        <h2>Transports</h2>
        <LazyTable objects={this.state.transports} />

      </div>
    );
  }

});

export default SystemSettings;
