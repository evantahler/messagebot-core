import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import Moment from 'moment';
import LazyTable from './../utils/lazyTable.jsx';
import LazyEditModal from '../utils/lazyEditModal.jsx';
import PaginationHelper from './../utils/paginationHelper.jsx';

const ListPeople = React.createClass({
  getInitialState(){
    return {
      perPage: 50,
      total: 0,
      list: [],
      people: [],
      listId: (this.props.params.listId),
      page: (this.props.params.page || 0),
      showUploadGuidModal: false,
      showUploadFileModal: false,
      personGuidContainer: {},
    };
  },

  componentWillMount(){
    this.loadList();
    this.loadListPeople();
    window.location.href = `/#/list/people/${this.state.listId}/${this.state.page}`;
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.params.page && nextProps.params.page !== this.state.page){
      this.setState({page: nextProps.params.page}, () => {
        window.location.href = `/#/list/people/${this.state.listId}/${this.state.page}`;
        this.loadListPeople();
      });
    }
  },

  openUploadGuidModal(){
    this.setState({ showUploadGuidModal: true });
  },

  closeUploadGuidModal(){
    this.setState({ showUploadGuidModal: false });
  },

  openUploadFileModal(){
    this.setState({ showUploadFileModal: true });
  },

  closeUploadFileModal(){
    this.setState({ showUploadFileModal: false });
  },

  loadList(){
    const client = this.props.client;

    client.action({listId: this.state.listId}, '/api/list', 'GET', (data) => {
      this.setState({list: data.list});
    });
  },

  loadListPeople(){
    const client = this.props.client;

    let params = {
      listId: this.state.listId,
      from: (this.state.page * this.state.perPage),
      size: this.state.perPage
    };

    client.action(params, '/api/list/people', 'GET', (data) => {
      let people = [];
      data.people.forEach((person) => {
        person.createdAt = Moment(new Date(Date.parse(person.createdAt))).fromNow();
        person.updatedAt = Moment(new Date(Date.parse(person.updatedAt))).fromNow();
        people.push(person);
      });

      this.setState({
        total: data.total,
        people: people,
      });
    });
  },

  processGuidModalUpload(){
    const client = this.props.client;

    let paylaod = {
      personGuids: this.state.personGuidContainer.personGuids,
      listId: this.state.listId
    };

    this.action(paylaod, '/api/list/people', 'PUT', (data) => {
      client.notify(data.personGuids.length + ' People Added', 'success');
      this.closeUploadGuidModal();
      this.loadListPeople();
      this.setState({personGuidContainer: {}});
    });
  },

  processFileModalUpload(){
    const client = this.props.client;
    const file = this.state.personGuidContainer._files[0];

    client.action({
      listId: this.state.listId,
      file: file,
    }, '/api/list/people', 'PUT', (data) => {
      client.notify(data.personGuids.length + ' People Added', 'success');
      this.setState({personGuidContainer: {}});
      this.closeUploadFileModal();
      this.loadListPeople();
    });
  },

  removePersonBuilder(){
    const parent = this;
    const client = this.props.client;

    if(this.state.list && this.state.list.type === 'static'){
      return(function(event){
        if(confirm('Are you sure?')){
          client.action({
            listId: parent.state.listId,
            personGuids: event.target.id
          }, '/api/list/people', 'DELETE', (data) => {
            client.notify('Person removed from list', 'success');
            parent.loadListPeople();
          });
        }
      });
    }else{
      return null;
    }
  },

  render(){
    return(
      <div>
        <h1>People in <strong>{ this.state.list.name }</strong> ({ this.state.total } total)</h1>

        {
          (() => {
            if(this.state.list && this.state.list.type === 'static'){
              return(
                <Row>
                  <Col md={12}>
                    <Button onClick={this.openUploadGuidModal}>Add List People via personGuid</Button>{' '}
                    <Button onClick={this.openUploadFileModal}>Add List People via file</Button>
                    <br />
                    <br />
                  </Col>
                </Row>
              );
            }else{
              return null;
            }
          })()
        }

        <LazyTable
          recordType="person"
          objects={this.state.people}
          ignoredKeys={[]}
          destroy={this.removePersonBuilder()}
        />

        <PaginationHelper
          location={this.props.location}
          currentPage={this.state.page}
          total={this.state.total}
          perPage={this.state.perPage}
        />

        <LazyEditModal
          title={'Add List People via personGuid'}
          description="Person Guids (seperate by commas)"
          object={this.state.personGuidContainer}
          show={this.state.showUploadGuidModal}
          onHide={this.closeUploadGuidModal}
          onSubmit={this.processGuidModalUpload}
          extraKeys={['personGuids']}
          types={{ personGuids: 'textarea' }}
        />

        <LazyEditModal
          title={'Add List People via File Upload'}
          description={
            <div>
              <p>File uploads should be .csv files with the first line containing header information.  guids are optional.</p>
              <pre>
guid, firstName, lastName, email{`\r\n`}
000001, Evan, Tahler, evan.tahler@gmail.com{`\r\n`}
000002, Christina, Hussain, christina.hussain@gmail.com{`\r\n`}
000003, Andy, Jih, andy.jih@gmail.com{`\r\n`}
000004, Heather, Tahler, heather.tahler@gmail.com{`\r\n`}
              </pre>
            </div>
          }
          object={this.state.personGuidContainer}
          show={this.state.showUploadFileModal}
          onHide={this.closeUploadFileModal}
          onSubmit={this.processFileModalUpload}
          extraKeys={['file']}
          types={{ file: 'file' }}
        />

      </div>
    );
  }
});

export default ListPeople;
