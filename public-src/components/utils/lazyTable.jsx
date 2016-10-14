import React from 'react';
import { Table, Glyphicon, FormGroup, FormControl } from 'react-bootstrap';
import WordHelper from './wordHelper.jsx';

const LazyTable = React.createClass({

  /*
  - `this.props.objects` is an array
  - `this.props.edit` is a function (or null to hide)
  - `this.props.copy` is a function (or null to hide)
  - `this.props.destroy` is a function (or null to hide)
  - `this.props.recordType` is the name of the item (for guid linksm IE: 'person')
  - `this.props.idName` (optional) what heading to use for the ID colum?
  - `this.props.inlineEdit` is an object containing the callback events on-submit for in-line forms, ie: `{name: handleNameChange}`
  - the objects have either `id`, `guid`, or `name` which is the primary key
  - `this.props.ignoredKeys` is an array of things to ignore in the form, or you can send `this.props.onlyKeys` to have a smaller list
  */

  getInitialState: function(){
    return {objects: []};
  },

  keys(){
    let keys = [];
    let i = 0;

    if(this.props.onlyKeys && this.props.onlyKeys.length > 0){
      return this.props.onlyKeys;
    }

    if(this.props.objects.length > 0){
      keys = Object.keys(this.props.objects[0]);
      keys = keys.sort();

      [
        'id',
        'guid',
        'createdAt',
        'updatedAt',
        'name',
        'source',
        'type',
        'transport',
        'personGuid'
      ].reverse().forEach(function(k){
        if(keys.indexOf(k) >= 0){
          keys.splice(keys.indexOf(k), 1);
          keys = [k].concat(keys);
        }
      });

      if(this.props.ignoredKeys && this.props.ignoredKeys.length > 0){
        this.props.ignoredKeys.forEach(function(p){
          if(keys.indexOf(p) >= 0){
            keys.splice(keys.indexOf(p), 1);
          }
        });
      }
    }

    return keys;
  },

  componentWillReceiveProps(nextProps){
    this.setState({objects: nextProps.objects});
  },

  handleChange(event){
    const parts =  event.target.id.split('%%');
    const keyId = parts[0];
    const key = parts[1];
    let i = 0;

    while(i < this.state.objects.length){
      let o = this.state.objects[i];
      if(
        (o.id && o.id.toString() === keyId) ||
        (o.guid && o.guid.toString() === keyId) ||
        (o.name && o.name.toString() === keyId)
      ){
        o[key] = event.target.value;
        this.state.objects[i] = o;
      }
      i++;
    }

    this.setState({objects: this.state.objects});
  },

  renderKey(object, key, keyId){
    if(key === 'guid' && this.props.recordType){
      return(
        <td key={'key-' + key}>
          <Glyphicon glyph="cog" />
          <a href={`/#/${ this.props.recordType }/${object[key]}`}> {object[key]} </a>
        </td>
      );
    }

    if(key === 'id' && this.props.recordType){
      return(
        <td key={'key-' + key}>
          <Glyphicon glyph="cog" />
          <a href={`/#/${ this.props.recordType }/${object[key]}`}> {object[key]} </a>
        </td>
      );
    }

    if(key === 'personGuid'){
      return(
        <td key={'key-' + key}>
          <a href={`/#/person/${object[key]}`}>{object[key]}</a>
        </td>
      );
    }

    if(object[key] === null || object[key] === undefined){
      return <td key={'key-' + key}></td>;
    }

    if(typeof object[key] === 'object'){
      return <td key={'key-' + key}><pre>{ JSON.stringify(object[key], null, 2) }</pre> </td>;
    }

    if(this.props.inlineEdit && typeof this.props.inlineEdit[key] === 'function'){
      let originalCallback = this.props.inlineEdit;
      let callback = (event) => {
        event.preventDefault();
        return originalCallback[key](object, key, keyId);
      };

      return(
        <td key={'key-' + key}>
          <form onSubmit={callback}>
            <FormGroup controlId={`${keyId}%%${key}`} style={{height:'20px'}}>
              <FormControl value={object[key] || ''} onChange={this.handleChange} type="text" />
            </FormGroup>
          </form>
        </td>
      );
    }

    return <td key={'key-' + key}>{object[key]}</td>;
  },

  render(){
    if(this.state.objects.length === 0){
      return null;
    }

    return(
      <Table striped bordered condensed hover responsive>
        <thead>
          <tr>
            {
                this.keys().map((key) => {
                  if(key === 'id' && this.props.idName){
                    return <th key={key}>{ this.props.idName }</th>;
                  }else{
                    return <th key={key}>{ WordHelper.titleize(key) }</th>;
                  }
                })
            }

            {
              ['edit', 'clone', 'destroy'].map((k) => {
                if(typeof this.props[k] === 'function'){
                  return (<th key={k}> </th>);
                }else{
                  return null;
                }
              })
            }

          </tr>
        </thead>

        <tbody>
          {
            this.state.objects.map((object) => {
              let keyId = (object.id || object.guid || object.name);

              return(
                <tr key={keyId}>
                  {
                    this.keys().map((key) => { return this.renderKey(object, key, keyId); })
                  }

                  <_EditColumn keyId={keyId} edit={this.props.edit} />
                  <_CloneColumn keyId={keyId} clone={this.props.clone} />
                  <_DeleteColumn keyId={keyId} destroy={this.props.destroy} />
                </tr>
              );
            })
          }
        </tbody>
      </Table>
    );
  }
});

const _EditColumn = React.createClass({
  render(){
    if(typeof this.props.edit === 'function'){
      return <td><Glyphicon glyph="pencil" id={this.props.keyId} onClick={this.props.edit} /> </td>;
    }else{
      return null;
    }
  }
});

const _CloneColumn = React.createClass({
  render(){
    if(typeof this.props.clone === 'function'){
      return <td><Glyphicon glyph="duplicate" id={this.props.keyId} onClick={this.props.clone} /> </td>;
    }else{
      return null;
    }
  }
});

const _DeleteColumn = React.createClass({
  render(){
    if(typeof this.props.destroy === 'function'){
      return <td><Glyphicon glyph="remove" id={this.props.keyId} onClick={this.props.destroy} /> </td>;
    }else{
      return null;
    }
  }
});

export default LazyTable;
