import React from 'react';
import { FormGroup, ControlLabel, FormControl, Button, Modal, Glyphicon } from 'react-bootstrap';
import WordHelper from './wordHelper.jsx';

const lazyEditModal = React.createClass({

  /*
  - `this.props.object` is an object
  - `this.props.show` is a boolean (should hte modal show/hide?)
  - `this.props.onHide` is a function
  - `this.props.onSubmit` is a function
  - `this.props.title` is a string
  - `this.props.description` Some body copy to show before the form
  - `this.props.types` can contain choices for the input types, via `this.props.types[keyName]`
  - `this.props.options` can contain choices for a SELECT block, via `this.props.options[keyName]`
  - `this.props.extraKeys` is an array of extra form choices
  - `this.props.ignoredKeys` is an array of things to ignore in the form
  */

  /*
  When Uploading files, a special `_files` object property will be crated for use in the parent container
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
        '_files',
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
    let value = event.target.value;
    this.state.object[event.target.id] = event.target.value;

    if(event.target.files){
      this.state.object._files = event.target.files;
    }

    this.setState({object: this.state.object});
  },

  render(){
    return(
      <div className="static-modal">
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header>
            <Modal.Title>{this.props.title}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {this.props.description}

            <form onSubmit={this.props.onSubmit}>
              {
                this.keys().map((key) => {
                  let type = 'text';
                  if(this.props.types && this.props.types[key]){
                    type = this.props.types[key];
                  }

                  if(!this.props.options || !this.props.options[key]){
                    if(type === 'textarea'){
                      return(
                        <FormGroup key={key} controlId={key}>
                          <ControlLabel>{ WordHelper.titleize(key) }</ControlLabel>
                          <FormControl componentClass="textarea" value={this.state.object[key] || ''} onChange={this.handleChange} />
                        </FormGroup>
                      );
                    }else if(type === 'textarea'){
                      return(
                        <FormGroup key={key} controlId={key}>
                          <ControlLabel>{ WordHelper.titleize(key) }</ControlLabel>
                          <FormControl componentClass="textarea" value={this.state.object[key] || ''} onChange={this.handleChange} />
                        </FormGroup>
                      );
                    }else{
                      return(
                        <FormGroup key={key} controlId={key}>
                          <ControlLabel>{ WordHelper.titleize(key) }</ControlLabel>
                          <FormControl value={this.state.object[key] || ''} onChange={this.handleChange} type={type} />
                        </FormGroup>
                      );
                    }

                  }else{
                    return(
                      <FormGroup key={key} controlId={key}>
                        <ControlLabel>{ WordHelper.titleize(key) }</ControlLabel>
                        <FormControl componentClass="select" value={this.state.object[key] || ''} onChange={this.handleChange} placeholder="...">
                          {
                            this.props.options[key].map((option) => {
                              if(option.id && option.name){
                                return <option key={option.id} value={option.id}>{ WordHelper.titleize(option.name) }</option>;
                              }else{
                                return <option key={option} value={option}>{ WordHelper.titleize(option) }</option>;
                              }
                            })
                          }
                        </FormControl>
                      </FormGroup>
                    );

                  }
                })
              }
            </form>
          </Modal.Body>

          <Modal.Footer>
            <Button bsStyle="primary" onClick={this.props.onSubmit}>{this.props.title}</Button>
            <Button onClick={this.props.onHide}>Close</Button>
          </Modal.Footer>

        </Modal>
      </div>
    );
  }
});

export default lazyEditModal;
