import React from 'react';
import Moment from 'moment';
import { Row, Col, Form, FormGroup, FormControl, ControlLabel, Button, Panel, Radio } from 'react-bootstrap';
import LazyTable from './../utils/lazyTable.jsx';
import LazyEditModal from '../utils/lazyEditModal.jsx';
import PaginationHelper from './../utils/paginationHelper.jsx';

const TemplatesList = React.createClass({
  getInitialState(){
    return {
      templates: [],
      folders: [],
      perPage: 50,
      total: 0,
      folder: (this.props.params.folder || '_all'),
      page: (this.props.params.page || 0),
      showNewModal: false,
      showEditModal: false,
      newTemplate: {},
      editTemplate: {},
    };
  },

  componentWillMount(){
    this.loadTemplates();
    this.loadFolders();
    window.location.href = `/#/templates/list/${this.state.folder}/${this.state.page}`;
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.params.page && nextProps.params.page !== this.state.page){
      this.setState({page: nextProps.params.page}, () => {
        window.location.href = `/#/templates/list/${this.state.folder}/${this.state.page}`;
        this.loadTemplates();
      });
    }

    if(nextProps.params.folder && nextProps.params.folder !== this.state.folder){
      this.setState({folder: nextProps.params.folder}, () => {
        window.location.href = `/#/templates/list/${this.state.folder}/${this.state.page}`;
        this.loadTemplates();
      });
    }
  },

  loadTemplates(){
    const client = this.props.client;

    let params = {
      from: (this.state.page * this.state.perPage),
      size: this.state.perPage
    };

    if(this.state.folder !== '_all'){ params.folder = this.state.folder; }

    client.action(params, '/api/templates', 'GET', (data) => {
      let templates = [];
      data.templates.forEach(function(template){
        template.createdAt = Moment(new Date(Date.parse(template.createdAt))).fromNow();
        template.updatedAt = Moment(new Date(Date.parse(template.updatedAt))).fromNow();
        templates.push(template);
      });

      this.setState({
        templates: templates,
        total: data.total,
      });
    });
  },

  editTemplate(event){
    let templateId = parseInt(event.target.id);
    this.state.templates.forEach((template) => {
      if(template.id === templateId){
        this.setState({editTemplate: template}, () => {
          this.openEditModal();
        });
      }
    });
  },

  cloneTemplate(event){
    const client = this.props.client;
    let input = prompt('Please enter a name for the new template');

    if(input){
      client.action({
        templateId: event.target.id,
        name: input
      }, '/api/template/copy', 'POST', (data) => {
        this.loadTemplates();
      });
    }
  },

  destroyTemplate(event){
    let client = this.props.client;

    if(confirm('Are you sure?')){
      client.action({templateId: event.target.id}, '/api/template', 'DELETE', (data) => {
        client.notify('Template Deleted', 'success');
        this.loadTemplates();
        this.loadFolders();
      });
    }
  },

  loadFolders(){
    const client = this.props.client;
    client.action({}, '/api/templates/folders', 'GET', (data) => {
      this.setState({folders: data.folders});
    });
  },

  changeFolder(event){
    this.setState({folder: event.target.value}, () => {
      window.location.href = `/#/templates/list/${this.state.folder}/${this.state.page}`;
      this.loadTemplates();
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

  processNewTemplateModal(){
    const client = this.props.client;

    client.action(this.state.newTemplate, '/api/template', 'POST', (data) => {
      this.state.newTemplate = {};
      client.notify('Created', 'success');
      this.closeNewModal();
      this.loadTemplates();
      this.loadFolders();
    });
  },

  processEditTemplateModal(){
    const client = this.props.client;

    this.state.editTemplate.templateId = this.state.editTemplate.id;
    client.action(this.state.editTemplate, '/api/template', 'PUT', (data) => {
      this.state.editTemplate = {};
      client.notify('Updated', 'success');
      this.closeEditModal();
      this.loadTemplates();
      this.loadFolders();
    });
  },

  render(){
    return(
      <div>
        <h1>Templates</h1>

        <Button onClick={this.openNewModal}>Create Template</Button>

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
              recordType="template"
              objects={this.state.templates}
              ignoredKeys={[
                'updatedAt',
                'template',
              ]}
              edit={this.editTemplate}
              clone={this.cloneTemplate}
              destroy={this.destroyTemplate}
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
          title={'Create Template'}
          object={this.state.newTemplate}
          show={this.state.showNewModal}
          onHide={this.closeNewModal}
          onSubmit={this.processNewTemplateModal}
          extraKeys={[
            'name',
            'description',
            'folder',
          ]}
        />

        <LazyEditModal
          title={'Edit Template'}
          object={this.state.editTemplate}
          show={this.state.showEditModal}
          onHide={this.closeEditModal}
          onSubmit={this.processEditTemplateModal}
          ignoredKeys={[
            'template'
          ]}
        />

      </div>
    );
  }
});

export default TemplatesList;
