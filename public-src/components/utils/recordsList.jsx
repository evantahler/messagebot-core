import React from 'react';
import Moment from 'moment';
import WordHelper from './wordHelper.jsx';
import PaginationHelper from './paginationHelper.jsx';
import LazyTable from './lazyTable.jsx';

const RecordsList = React.createClass({

  // requires:
  // `this.props.section`: The name of the thing we are reasoning about (people, messages, etc)
  // `this.props.client`: ActionHero Client
  // `this.props.query`: search query (optional)
  // `this.props.params`: the `params` object from the parent (URL information)
  // `this.props.location`: the `location` object from the parent (Route information)
  // `this.props.perPage` (defalut 25)

  getInitialState(){
    return {
      total: 0,
      query: this.props.query,
      records: [],
      page: parseInt(this.props.params.page || 0),
      perPage: (this.props.perPage || 25),
    };
  },

  componentDidMount: function(){
    this.loadRecent();
  },

  componentWillReceiveProps: function(newProps){
    const newPage = parseInt(newProps.params.page || 0);
    if(this.state.page !== newPage){
      this.setState({page: newPage}, () => {
        this.loadRecent();
      });
    }

    else if(newProps.query && this.state.query !== newProps.query){
      this.setState({query: newProps.query}, () => {
        this.loadRecent();
      });
    }
  },

  loadRecent: function(){
    const client = this.props.client;

    let searchKeys = ['guid'];
    let searchValues = ['_exists'];

    if(this.state.query === ''){ return; }
    if(this.state.query){
      [searchKeys, searchValues] = WordHelper.routeQueryToParams(this.state.query);
    }

    client.action({
      searchKeys: searchKeys,
      searchValues: searchValues,
      from: (this.state.page * this.state.perPage),
      size: this.state.perPage,
    }, '/api/' + this.props.section + '/search', 'GET', (data) => {
      let cleanedData = [];
      data[this.props.section].forEach(function(record){
        record.createdAt = Moment(record.createdAt).fromNow();
        record.updatedAt = Moment(record.updatedAt).fromNow();

        if(record.sentAt){
          record.sentAt = Moment(record.sentAt).fromNow();
        }

        delete record.body;

        cleanedData.push(record);
      });

      this.setState({
        total: data.total,
        records: cleanedData,
      });
    });
  },

  viewDetails: function(event){
    let id = event.target.id;
    let newPathname = `/#/${WordHelper.singleize(this.props.section)}/${id}`;
    window.location.href = newPathname;
  },

  render(){
    if(this.state.query === ''){ return null; }

    let title = 'Recent';
    if(this.state.query){ title = 'Found'; }

    return(
      <div>
        <h2>{title} { WordHelper.titleize(this.props.section) } ({ this.state.total } total)</h2>
        <LazyTable
          recordType={WordHelper.singleize(this.props.section)}
          objects={this.state.records}
        />

        <PaginationHelper
          location={this.props.location}
          currentPage={this.state.page}
          total={this.state.total}
          perPage={this.state.perPage}
        />
      </div>
    );
  }
});

export default RecordsList;
