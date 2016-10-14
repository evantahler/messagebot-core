import React from 'react';
import { FormGroup, ControlLabel, FormControl, Button, Panel, Glyphicon } from 'react-bootstrap';
import WordHelper from './wordHelper.jsx';

const lazyEditPanel = React.createClass({

  /*
  - `this.props.object` is an object
  - `this.props.onSubmit` is a function
  - `this.props.title` is a string
  - `this.props.types` can contain choices for the input types, via `this.props.types[keyName]`
  - `this.props.options` can contain choices for a SELECT block, via `this.props.options[keyName]`
  - `this.props.extraKeys` is an array of extra form choices
  - `this.props.ignoredKeys` is an array of things to ignore in the form
  */

  getInitialState: function(){
    return {object: {}};
  },

  keys(){
    let keys = [];
    let i = 0;

    if(this.props.object){
      keys = Object.keys(this.props.object);

      if(this.props.extraKeys && this.props.extraKeys.length > 0){
        this.props.extraKeys.forEach(function(key){
          if(keys.indexOf(key) < 0){
            keys.push(key);
          }
        });
      }

      (this.props.ignoredKeys || []).concat(
        'id',
        'guid',
        'createdAt',
        'updatedAt',
        'personGuid'
      ).forEach(function(k){
        if(keys.indexOf(k) >= 0){
          keys.splice(keys.indexOf(k), 1);
        }
      });
    }

    keys.sort();

    return keys;
  },

  componentWillReceiveProps(nextProps){
    this.state.object = nextProps.object;
  },

  handleChange(event){
    this.state.object[event.target.id] = event.target.value;
    this.setState({object: this.state.object});
  },

  render(){
    return(
      <Panel header={this.props.title}>
        <form onSubmit={this.props.onSubmit}>
          {
            this.keys().map((key) => {
              let type = 'text';
              if(this.props.types && this.props.types[key]){
                type = this.props.types[key];
              }

              if(!this.props.options || !this.props.options[key]){

                return(
                  <FormGroup key={key} controlId={key}>
                    <ControlLabel>{ WordHelper.titleize(key) }</ControlLabel>
                    <FormControl value={this.state.object[key] || ''} onChange={this.handleChange} type={type} />
                  </FormGroup>
                );

              }else{
                return(
                  <FormGroup key={key} controlId={key}>
                    <ControlLabel>{ WordHelper.titleize(key) }</ControlLabel>
                    <FormControl componentClass="select" value={this.state.object[key] || ''} onChange={this.handleChange} placeholder="...">
                      {
                        this.props.options[key].map((option) => {
                          return <option key={option} value={option}>{ WordHelper.titleize(option) }</option>;
                        })
                      }
                    </FormControl>
                  </FormGroup>
                );

              }
            })
          }

          <Button type="submit" bsStyle="success"><Glyphicon glyph="flash" />Submit</Button>
        </form>
      </Panel>
    );
  }
});

export default lazyEditPanel;
