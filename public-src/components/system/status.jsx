import React from 'react';
import { Row, Col, Panel, Well, Label } from 'react-bootstrap';
import LazyTable from '../utils/lazyTable.jsx';
import Moment from 'moment';

const SystemStatus = React.createClass({

  getInitialState: function(){
    return {status: false};
  },

  componentWillMount: function(){
    this.loadStatus();
  },

  loadStatus(){
    const client = this.props.client;
    let settings = [];

    client.action({}, '/api/system/status', 'GET', (data) => {
      data.node.bootedAgo = Moment(new Date().getTime() - data.node.uptime).fromNow();
      data.redis.tasks.memoryPercent = Math.round(data.redis.tasks.used_memoryMB / data.redis.tasks.total_system_memoryMB * 100) / 100;
      data.redis.client.memoryPercent = Math.round(data.redis.client.used_memoryMB / data.redis.client.total_system_memoryMB * 100) / 100;

      this.setState({status: data});
    });
  },

  render(){
    let status = this.state.status;

    if(!status){
      return <em>loading...</em>;
    }

    return(
      <div>

        <Row>
          <Col md={12}>
            <h1>MessageBot {'@'} <strong>{ status.node.team.trackingDomain }</strong></h1>
          </Col>
        </Row>

        <Well>
          <Row>
            <Col md={2}>
              <div style={{textAlign: 'center'}}>
                <h2>
                  <Label bsStyle={status.node.healthy ? 'success' : 'danger'}>{status.node.healthy ? 'Healthy' : 'Unhealthy'}</Label>
                </h2>
              </div>
              <hr />
              {/* <img width="100%" src="/images/logo/logo.png" /> */}
              <img width="100%" src="/images/vendors/nodejs.png" />
            </Col>

            <Col md={10}>
              <Panel header={'Node Status'}>
                  <h4>Node ID: { status.node.id }</h4>
                  <ul>
                    <li><strong>Local MessageBot Version</strong>: { status.node.version }</li>
                    <li><strong>Booted</strong>: { status.node.bootedAgo }</li>
                    <li><strong>Local Event Loop Delay</strong>: { status.node.avgEventLoopDelay }ms</li>
                    <li><strong>Memory Used</strong>: { status.node.memoryUsedMB }MB</li>
                    <li><strong>Local Pending Elasticsaerch Opeartions</strong>: { status.node.elasticsaerchPendingOperations } ({ status.node.elasticsaerchPendingOperationsPercent }%)</li>
                    <li><strong>ActionHero Version</strong>: { status.node.actionheroVersion }</li>
                  </ul>
              </Panel>
            </Col>
          </Row>
        </Well>

        <Well>
          <Row>
            <Col md={2}>
              <div style={{textAlign: 'center'}}>
                <h2>
                  <Label bsStyle={status.database.healthy ? 'success' : 'danger'}>{status.database.healthy ? 'Healthy' : 'Unhealthy'}</Label>
                </h2>
              </div>
              <hr />
              <img width="100%" src="/images/vendors/database.png" />
            </Col>

            <Col md={10}>
              <Panel header={'Database Status'}>
                <ul>
                  <li><strong>Campaigns</strong>: { status.database.campaign }</li>
                  <li><strong>Lists</strong>: { status.database.list }</li>
                  <li><strong>ListPeople</strong>: { status.database.listPerson }</li>
                  <li><strong>Templates</strong>: { status.database.template }</li>
                  <li><strong>Users</strong>: { status.database.user }</li>
                </ul>
              </Panel>
            </Col>
          </Row>
        </Well>

        <Well>
          <Row>
            <Col md={2}>
              <div style={{textAlign: 'center'}}>
                <h2>
                  <Label bsStyle={status.elasticsearch.health.status === 'green' ? 'success' : 'danger'}>{status.elasticsearch.health.status}</Label>
                </h2>
              </div>
              <hr />
              <img width="100%" src="/images/vendors/elasticsearch.png" />
            </Col>

            <Col md={10}>
              <Panel header={'Elasticsearch Status'}>
                <ul>
                  <li><strong>Cluster Name</strong>: { status.elasticsearch.info.cluster_name }</li>
                  <li><strong>Version</strong>: { status.elasticsearch.info.version.number }</li>
                  <li><strong>Number of Nodes</strong>: { status.elasticsearch.health.number_of_nodes }</li>
                  <li><strong>Active Shards</strong>: { status.elasticsearch.health.active_shards }</li>
                  <li><strong>Relocating Shards</strong>: { status.elasticsearch.health.relocating_shards }</li>
                  <li><strong>Initializing Shards</strong>: { status.elasticsearch.health.initializing_shards }</li>
                  <li><strong>Unassigned Shards</strong>: { status.elasticsearch.health.unassigned_shards }</li>
                </ul>
              </Panel>
            </Col>
          </Row>
        </Well>

        <Well>
          <Row>
            <Col md={2}>
              <img width="100%" src="/images/vendors/redis.png" />
            </Col>

            <Col md={10}>
              <Panel header={'Resque Queues'}>
                <ul>
                  {
                    Object.keys(status.resque.queues).map(function(k){
                      let v = status.resque.queues[k];
                      return <li key={k}><strong>{ k }</strong>: { v.length }</li>;
                    })
                  }
                </ul>
              </Panel>
            </Col>

            <Col md={2}>
              <div style={{textAlign: 'center'}}>
                <h2>
                  <Label bsStyle={status.redis.tasks.healthy ? 'success' : 'danger'}>{status.redis.tasks.healthy ? 'Healthy' : 'Unhealthy'}</Label>
                </h2>
              </div>
            </Col>

            <Col md={10}>
              <Panel header={'Redis Tasks'}>
                <ul>
                  <li><strong>Version</strong>: { status.redis.tasks.redis_version }</li>
                  <li><strong>Uptime</strong>: { status.redis.tasks.uptime_in_seconds }</li>
                  <li><strong>Connected Clients</strong>: { status.redis.tasks.connected_clients }</li>
                  <li><strong>Memory</strong>: { status.redis.tasks.used_memoryMB }MB / { status.redis.tasks.total_system_memoryMB }MB ({ status.redis.tasks.memoryPercent }%)</li>
                  <li><strong>Operations / Second</strong>: { status.redis.tasks.instantaneous_ops_per_sec }</li>
                  <li><strong>Instantaneous Network In</strong>: { status.redis.tasks.instantaneous_input_kbps }Kb</li>
                  <li><strong>Instantaneous Network Out</strong>: { status.redis.tasks.instantaneous_output_kbps }Kb</li>
                </ul>
              </Panel>
            </Col>

            <Col md={2}>
              <div style={{textAlign: 'center'}}>
                <h2>
                  <Label bsStyle={status.redis.client.healthy ? 'success' : 'danger'}>{status.redis.client.healthy ? 'Healthy' : 'Unhealthy'}</Label>
                </h2>
              </div>
            </Col>

            <Col md={10}>
              <Panel header={'Redis Tasks'}>
                <ul>
                  <li><strong>Version</strong>: { status.redis.client.redis_version }</li>
                  <li><strong>Uptime</strong>: { status.redis.client.uptime_in_seconds }</li>
                  <li><strong>Connected Clients</strong>: { status.redis.client.connected_clients }</li>
                  <li><strong>Memory</strong>: { status.redis.client.used_memoryMB }MB / { status.redis.client.total_system_memoryMB }MB ({ status.redis.client.memoryPercent }%)</li>
                  <li><strong>Operations / Second</strong>: { status.redis.client.instantaneous_ops_per_sec }</li>
                  <li><strong>Instantaneous Network In</strong>: { status.redis.client.instantaneous_input_kbps }Kb</li>
                  <li><strong>Instantaneous Network Out</strong>: { status.redis.client.instantaneous_output_kbps }Kb</li>
                </ul>
              </Panel>
            </Col>
          </Row>
        </Well>

      </div>
    );
  }

});

export default SystemStatus;
