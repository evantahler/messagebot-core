import React from 'react';
import Moment from 'moment';
import { Row, Col, Form, FormGroup, FormControl, ControlLabel, Button, Panel, Radio } from 'react-bootstrap';
import LazyTable from './../utils/lazyTable.jsx';
import LazyEditModal from '../utils/lazyEditModal.jsx';
import PaginationHelper from './../utils/paginationHelper.jsx';

const CampaignsList = React.createClass({
  getInitialState(){
    return {
      folders: [],
      campaigns: [],
      lists: [],
      templates: [],
      transports: [],
      types: [],
      perPage: 50,
      total: 0,
      folder: (this.props.params.folder || '_all'),
      page: (this.props.params.page || 0),
      showNewModal: false,
      showEditModal: false,
      newCampaign: {},
      editCampaign: {},
    };
  },

  componentWillMount(){
    this.loadCampaigns();
    this.loadTemplates();
    this.loadLists();
    this.loadFolders();
    this.loadTypes();
    this.loadTransports();
    window.location.href = `/#/campaigns/list/${this.state.folder}/${this.state.page}`;
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.params.page && nextProps.params.page !== this.state.page){
      this.setState({page: nextProps.params.page}, () => {
        window.location.href = `/#/campaigns/list/${this.state.folder}/${this.state.page}`;
        this.loadCampaigns();
      });
    }

    if(nextProps.params.folder && nextProps.params.folder !== this.state.folder){
      this.setState({folder: nextProps.params.folder}, () => {
        window.location.href = `/#/campaigns/list/${this.state.folder}/${this.state.page}`;
        this.loadCampaigns();
      });
    }
  },

  loadCampaigns(){
    const client = this.props.client;

    let params = {
      from: (this.state.page * this.state.perPage),
      size: this.state.perPage
    };

    if(this.state.folder !== '_all'){ params.folder = this.state.folder; }

    client.action(params, '/api/campaigns', 'GET', (data) => {
      let campaigns = [];
      data.campaigns.forEach(function(campaign){
        if(campaign.createdAt){ campaign.createdAt = Moment(new Date(Date.parse(campaign.createdAt))).fromNow(); }
        if(campaign.updatedAt){ campaign.updatedAt = Moment(new Date(Date.parse(campaign.updatedAt))).fromNow(); }
        if(campaign.sendAt){ campaign.sendAt    = Moment(new Date(Date.parse(campaign.sendAt))).fromNow(); }

        campaigns.push(campaign);
      });

      this.setState({
        campaigns: campaigns,
        total: data.total,
      }, () => { this.hydrateCampaigns(); });
    });
  },

  hydrateCampaigns(){
    let campaigns = this.state.campaigns;
    let hydratedCampaigns = [];

    campaigns.forEach((campaign) => {
      this.state.lists.forEach((list) => {
        if(list.id === campaign.listId){ campaign.list = list.name; }
      });

      this.state.templates.forEach((template) => {
        if(template.id === campaign.templateId){ campaign.template = template.name; }
      });

      hydratedCampaigns.push(campaign);
    });

    this.setState({campaigns: hydratedCampaigns});
  },

  loadFolders(){
    const client = this.props.client;
    client.action({}, '/api/campaigns/folders', 'GET', (data) => {
      this.setState({folders: data.folders});
    });
  },

  loadTemplates(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/templates', 'GET', (data) => {
      this.setState({templates: data.templates}, () => { this.hydrateCampaigns(); });
    });
  },

  loadLists(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/lists', 'GET', (data) => {
      this.setState({lists: data.lists}, () => { this.hydrateCampaigns(); });
    });
  },

  loadTypes(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/campaigns/types', 'GET', (data) => {
      this.setState({types: data.validTypes});
    });
  },

  loadTransports(){
    // TODO: Pagination
    const client = this.props.client;

    client.action({}, '/api/transports', 'GET', (data) => {
      let transports = [];
      Object.keys(data.transports).forEach((transport) => {
        transports.push(data.transports[transport]);
      });

      this.setState({transports: transports});
    });
  },

  editCampaign(event){
    let campaignId = parseInt(event.target.id);

    this.state.campaigns.forEach((campaign) => {
      if(campaign.id === campaignId){
        this.setState({editCampaign: campaign}, () => {
          this.openEditModal();
        });
      }
    });
  },

  cloneCampaign(event){
    const client = this.props.client;
    let input = prompt('Please enter a name for the new campaign');

    if(input){
      client.action({
        campaignId: event.target.id,
        name: input
      }, '/api/campaign/copy', 'POST', (data) => {
        this.loadCampaigns();
      });
    }
  },

  destroyCampaign(event){
    let client = this.props.client;

    if(confirm('Are you sure?')){
      client.action({campaignId: event.target.id}, '/api/campaign', 'DELETE', (data) => {
        client.notify('Campaign Deleted', 'success');
        this.loadCampaigns();
        this.loadFolders();
      });
    }
  },

  changeFolder(event){
    this.setState({folder: event.target.value}, () => {
      window.location.href = `/#/campaigns/list/${this.state.folder}/${this.state.page}`;
      this.loadCampaigns();
    });
  },

  openNewModal(){
    this.setState({ showNewModal: true });
  },

  closeNewModal(){
    this.setState({ showNewModal: false });
  },

  openEditModal(){
    this.setState({ showEditModal: true });
  },

  closeEditModal(){
    this.setState({ showEditModal: false });
  },

  processNewCampaignModal(){
    const client = this.props.client;

    client.action(this.state.newCampaign, '/api/campaign', 'POST', (data) => {
      this.state.newCampaign = {};
      client.notify('Created', 'success');
      this.closeNewModal();
      this.loadCampaigns();
      this.loadFolders();
    });
  },

  processEditCampaignModal(){
    const client = this.props.client;

    client.action({
      campaignId:  this.state.editCampaign.id,
      name:        this.state.editCampaign.name,
      description: this.state.editCampaign.description,
      folder:      this.state.editCampaign.folder,
      transport:   this.state.editCampaign.transport,
      type:        this.state.editCampaign.type,
      listId:      this.state.editCampaign.listId,
      templateId:  this.state.editCampaign.templateId,
    }, '/api/campaign', 'PUT', (data) => {
      this.state.editCampaign = {};
      client.notify('Updated', 'success');
      this.closeEditModal();
      this.loadCampaigns();
      this.loadFolders();
    });
  },

  render(){
    return(
      <div>
        <h1>Campaigns</h1>

        <Button onClick={this.openNewModal}>Create Campaign</Button>

        <Row>
          <Col md={3}>
            <br />
            <Panel header="Folders">
              <FormGroup>
                <Radio checked={(this.state.folder === '_all')} value="_all" onChange={this.changeFolder} inline>Show All</Radio>
                <hr />
                {
                  this.state.folders.map((f) => {
                    return(
                      <div key={f}>
                        <Radio checked={(f === this.state.folder)} value={f} onChange={this.changeFolder} key={f} inline>{f}</Radio>
                        <br />
                      </div>
                    );
                  })
                }
              </FormGroup>
            </Panel>
          </Col>

          <Col md={9}>
            <br />
            <LazyTable
              recordType="campaign"
              objects={this.state.campaigns}
              ignoredKeys={[
                'updatedAt',
                'sendingAt',
                'sentAt',
                'listId',
                'templateId',
                'reSendDelay',
                'campaignVariables',
                'triggerDelay',
                'triggerEventMatch'
              ]}
              edit={this.editCampaign}
              clone={this.cloneCampaign}
              destroy={this.destroyCampaign}
            />

            <PaginationHelper
              location={this.props.location}
              currentPage={this.state.page}
              total={this.state.total}
              perPage={this.state.perPage}
            />
          </Col>
        </Row>

        <LazyEditModal
          title={'Create Campaign'}
          object={this.state.newCampaign}
          show={this.state.showNewModal}
          onHide={this.closeNewModal}
          onSubmit={this.processNewCampaignModal}
          options={{
            templateId: this.state.templates,
            type: this.state.types,
            listId: this.state.lists,
            transport: this.state.transports.map((e) => { return e.name; }),
          }}
          extraKeys={[
            'name',
            'description',
            'folder',
            'transport',
            'type',
            'listId',
            'templateId',
          ]}
        />

        <LazyEditModal
          title={'Edit Template'}
          object={this.state.editCampaign}
          show={this.state.showEditModal}
          onHide={this.closeEditModal}
          onSubmit={this.processEditCampaignModal}
          options={{
            templateId: this.state.templates,
            type: this.state.types,
            listId: this.state.lists,
            transport: this.state.transports.map((e) => { return e.name; }),
          }}
          ignoredKeys={[
            'list',
            'template',
            'campaignVariables',
            'reSendDelay',
            'sendAt',
            'sendingAt',
            'sentAt',
            'triggerDelay',
            'triggerEventMatch',
          ]}
        />

      </div>
    );
  }
});

export default CampaignsList;
