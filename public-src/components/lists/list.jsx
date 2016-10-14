import React from 'react';
import Moment from 'moment';
import { Row, Col, Form, FormGroup, FormControl, ControlLabel, Button, Panel, Radio } from 'react-bootstrap';
import LazyTable from './../utils/lazyTable.jsx';
import LazyEditModal from '../utils/lazyEditModal.jsx';
import PaginationHelper from './../utils/paginationHelper.jsx';

const ListsList = React.createClass({
  getInitialState(){
    return {
      lists: [],
      folders: [],
      perPage: 50,
      total: 0,
      folder: (this.props.params.folder || '_all'),
      page: (this.props.params.page || 0),
      showNewStaticModal: false,
      showNewDynamicModal: false,
      showEditStaticModal: false,
      showEditDynamicModal: false,
      newType: '',
      newList: {},
      editList: {},
    };
  },

  componentWillMount(){
    this.loadLists();
    this.loadFolders();
    window.location.href = `/#/lists/list/${this.state.folder}/${this.state.page}`;
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.params.page && nextProps.params.page !== this.state.page){
      this.setState({page: nextProps.params.page}, () => {
        window.location.href = `/#/lists/list/${this.state.folder}/${this.state.page}`;
        this.loadLists();
      });
    }

    if(nextProps.params.folder && nextProps.params.folder !== this.state.folder){
      this.setState({folder: nextProps.params.folder}, () => {
        window.location.href = `/#/lists/list/${this.state.folder}/${this.state.page}`;
        this.loadLists();
      });
    }
  },

  loadLists(){
    const client = this.props.client;

    let params = {
      from: (this.state.page * this.state.perPage),
      size: this.state.perPage
    };

    if(this.state.folder !== '_all'){ params.folder = this.state.folder; }

    client.action(params, '/api/lists', 'GET', (data) => {
      let lists = [];
      data.lists.forEach((list) => {
        list.createdAt = Moment(new Date(Date.parse(list.createdAt))).fromNow();
        list.updatedAt = Moment(new Date(Date.parse(list.updatedAt))).fromNow();
        if(list.peopleCountedAt){
          list.peopleCountedAt = Moment(new Date(Date.parse(list.peopleCountedAt))).fromNow();
        }

        if(list.personQuery){ list.personQuery = JSON.stringify(list.personQuery, 0, 2); }
        if(list.eventQuery){ list.eventQuery = JSON.stringify(list.eventQuery, 0, 2); }
        if(list.messageQuery){ list.personQuery = JSON.stringify(list.messageQuery, 0, 2); }

        lists.push(list);
      });

      this.setState({
        lists: lists,
        total: data.total,
      });
    });
  },

  editList(event){
    let listId = parseInt(event.target.id);
    this.state.lists.forEach((list) => {
      if(list.id === listId){
        this.setState({editList: list}, () => {
          if(list.type === 'static'){
            this.openEditStaticModal();
          }else{
            this.openEditDynamicModal();
          }
        });
      }
    });
  },

  cloneList(event){
    const client = this.props.client;
    let input = prompt('Please enter a name for the new list');

    if(input){
      client.action({
        listId: event.target.id,
        name: input
      }, '/api/list/copy', 'POST', (data) => {
        this.loadLists();
      });
    }
  },


  destroyList(event){
    const client = this.props.client;

    if(confirm('Are you sure?')){
      client.action({listId: event.target.id}, '/api/list', 'DELETE', (data) => {
        client.notify('List Deleted', 'success');
        this.loadLists();
        this.loadFolders();
      });
    }
  },

  loadFolders(){
    const client = this.props.client;

    client.action({}, '/api/lists/folders', 'GET', (data) => {
      this.setState({folders: data.folders});
    });
  },

  changeFolder(event){
    this.setState({folder: event.target.value}, () => {
      window.location.href = `/#/lists/list/${this.state.folder}/${this.state.page}`;
      this.loadLists();
    });
  },

  openNewStaticModal(){
    this.setState({ showNewStaticModal: true, newType: 'static' });
  },

  closeNewStaticModal(){
    this.setState({ showNewStaticModal: false });
  },

  openEditStaticModal(){
    this.setState({ showEditStaticModal: true });
  },

  closeEditStaticModal(){
    this.setState({ showEditStaticModal: false });
  },

  openNewDynamicModal(){
    this.setState({ showNewDynamicModal: true, newType: 'dynamic' });
  },

  closeNewDynamicModal(){
    this.setState({ showNewDynamicModal: false });
  },

  openEditDynamicModal(){
    this.setState({ showEditDynamicModal: true });
  },

  closeEditDynamicModal(){
    this.setState({ showEditDynamicModal: false });
  },

  processNewListModal(){
    const client = this.props.client;

    this.state.newList.type = this.state.newType;
    client.action(this.state.newList, '/api/list', 'POST', (data) => {
      this.state.newList = {};
      client.notify('Created', 'success');
      this.closeNewStaticModal();
      this.loadLists();
      this.loadFolders();
    });
  },

  processEditListModal(){
    const client = this.props.client;

    this.state.editList.listId = this.state.editList.id;
    client.action(this.state.editList, '/api/list', 'PUT', (data) => {
      this.state.editList = {};
      client.notify('Updated', 'success');
      this.closeEditStaticModal();
      this.closeEditDynamicModal();
      this.loadLists();
      this.loadFolders();
    });
  },

  render(){
    return(
      <div>
        <h1>Lists</h1>

        <Button onClick={this.openNewStaticModal}>Create Static List</Button>{' '}
        <Button onClick={this.openNewDynamicModal}>Create Dynamic List</Button>

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
              recordType="list/people"
              objects={this.state.lists}
              ignoredKeys={[
                'updatedAt',
                'eventQuery',
                'personQuery',
                'messageQuery',
              ]}
              edit={this.editList}
              clone={this.cloneList}
              destroy={this.destroyList}
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
          title={'Create Static List'}
          object={this.state.newList}
          show={this.state.showNewStaticModal}
          onHide={this.closeNewStaticModal}
          onSubmit={this.processNewListModal}
          extraKeys={[
            'name',
            'description',
            'folder',
          ]}
        />

        <LazyEditModal
          title={'Create Dynamic List'}
          object={this.state.newList}
          show={this.state.showNewDynamicModal}
          onHide={this.closeNewDynamicModal}
          onSubmit={this.processNewListModal}
          types={{
            personQuery: 'textarea',
            eventQuery: 'textarea',
            messageQuery: 'textarea',
          }}
          extraKeys={[
            'name',
            'description',
            'folder',
            'personQuery',
            'eventQuery',
            'messageQuery',
          ]}
        />

        <LazyEditModal
          title={'Edit Static List'}
          object={this.state.editList}
          show={this.state.showEditStaticModal}
          onHide={this.closeEditStaticModal}
          onSubmit={this.processEditListModal}
          ignoredKeys={[
            'eventQuery',
            'personQuery',
            'messageQuery',
            'peopleCount',
            'peopleCountedAt',
            'type',
          ]}
        />

        <LazyEditModal
          title={'Edit Dynamic List'}
          object={this.state.editList}
          show={this.state.showEditDynamicModal}
          onHide={this.closeEditDynamicModal}
          onSubmit={this.processEditListModal}
          types={{
            personQuery: 'textarea',
            eventQuery: 'textarea',
            messageQuery: 'textarea'
          }}
          ignoredKeys={[
            'peopleCount',
            'peopleCountedAt',
            'type',
          ]}
        />

      <hr />

      <div>
        <strong>Query Notes:</strong>
        <ul>
          <li>Do not include "query" as the top level of your query hash.</li>
          <li>We will validate and format your JSON for you.</li>
          <li>Remember to "quote" JSON keys and values</li>
          <li>Alawys use lower-case when matching strings: <pre>
{`{
    "bool": {
        "must": [
            {
                "wildcard": {
                    "data.firstName": "e*"
                }
            }
        ]
    }
}
`}
      </pre></li>
      <li>You can short-hand queries with a single match:<pre>
{`{
    "wildcard": {
        "data.firstName": "e*"
    }
}
`}
      </pre></li>
      <li>And finally, you can make compound queries which will be joined with *AND*.  Here is how you would send an email to all users who signed up this month who have bought a product.<pre>
{`// USERS
{
  "range" : {
    "createdAt" : {
      "gte" : "now-1M",
      "lte" : "now"
    }
  }
}

// EVENTS
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "type": "purchase"
          }
        }
      ]
    }
  }
}
`}
          </pre></li>
        </ul>
      </div>

      </div>
    );
  }
});

export default ListsList;
