import React from 'react';
import { Row, Col, Button} from 'react-bootstrap';
import brace from 'brace';
import AceEditor from 'react-ace';
import LazyIframe from './../utils/lazyIframe.jsx';

// for the editor
import 'brace/mode/html';
import 'brace/theme/github';

const TemplateEdit = React.createClass({
  getInitialState(){
    return {
      templateId: this.props.params.id,
      personGuid: this.props.user.personGuid,
      template: {template: ''},
      view: {},
      render: '',
      lastRender: null,
      secondsBeforeRednerWhileTyping: 5,
    };
  },

  componentWillMount(){
    this.loadTemplate();
    this.loadView();
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.user){
      this.setState({personGuid: nextProps.user.personGuid}, () => {
        this.loadView();
      });
    }
  },

  loadTemplate(){
    const client = this.props.client;

    client.action({templateId: this.state.templateId}, '/api/template', 'GET', (data) => {
      this.setState({template: data.template});
    });
  },

  loadView(){
    const client = this.props.client;

    if(!this.state.personGuid){
      this.setState({ lastRender: new Date() });
      return;
    }

    let params = {
      templateId: this.state.templateId,
      personGuid: this.state.personGuid,
      trackBeacon: false,
    };

    if(this.state.template.template && this.state.template.template !== ''){
      params.temporaryTemplate = this.state.template.template;
    }

    client.action(params, '/api/template/render', 'GET', (data) => {
      this.setState({
        view: data.view,
        lastRender: new Date(),
      });
    });

    let HTMLoptions = {
      credentials: 'include',
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(params)
    };

    const parent = this;
    fetch('/api/template/render.html', HTMLoptions).then(function(response){
      response.text().then((body) => {
        parent.setState({render: body});
      });
    }).catch(function(error){
      console.error(error);
    });
  },

  updateTemplate(){
    const client = this.props.client;

    this.state.template.templateId = this.state.template.id;
    this.setState({template: this.state.template}, () => {
      client.action(this.state.template, '/api/template', 'PUT', (data) => {
        client.notify('Updated', 'success');
        this.loadTemplate();
        this.loadView();
      });
    });
  },

  handleInlineChange(event){
    this.state.template[event.target.id] = event.target.value;
    this.setState({template: this.state.template});
  },

  editorUpdate(newBody){
    if(!newBody || newBody === ''){ return; }
    this.state.template.template = newBody;
    this.setState({template: this.state.template}, () => {
      if(
        (new Date().getTime() - this.state.lastRender.getTime()) >
        (1000 * this.state.secondsBeforeRednerWhileTyping)
      ){
        this.loadView();
      }
    });
  },

  changePersonGuid(event){
    this.setState({personGuid: event.target.value});
  },

  render(){
    const template = this.state.template;
    const view     = this.state.view;

    return(
      <div>
        <h1>Edit Template: <input value={template.name || ''} id="name" onChange={this.handleInlineChange}/></h1>
        <p>
          Description: <input size="50" type="text" value={template.description || ''} id="description" onChange={this.handleInlineChange} />
        </p>

        <Button onClick={this.updateTemplate}>Save Changes</Button>

        <hr />

        <Row>
          <Col md={6}>
            <h3>Template</h3>

            <AceEditor
              mode="html"
              theme="github"
              value={template.template || ''}
              onChange={this.editorUpdate}
              editorProps={{
                highlightActiveLine: true,
                showGutter: true,
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
                width: '100%',
                $blockScrolling: Infinity
              }}
            />

            {/* <p><a onclick="$('#fullScreenCode').modal('show');" class="btn btn-primary btn-xs">View FullScreen</a> (click + esc to close)</p> */}
            <p>You can use mustache templates to render person or event attributes</p>
            <p>To track links, use mustache function <em>track</em> to transform URLs into tracked URLs. To include a beacon image, include <em>beacon</em> in your body, using tripple mustache.</p>
            <p>To include a partial template in this one, use the <em>render</em> mustache function with the name of ID of the template you wisth to include</p>
            <p>Use the <em>optOutLink</em> mustache function to option the link to the opt-out URL.  With no arguments it will direct to the default page, but you can supply your own</p>

            <hr />

            <h3>Variables</h3>
            <pre>{JSON.stringify(view, 0, 2)}</pre>

          </Col>

          <Col md={6}>
            <h3>Preview</h3>
            <p>personGuid: <input type="text" value={this.state.personGuid || ''} onChange={this.changePersonGuid} /> Link: <input value={template.url} readOnly /></p>
            <hr />
            <LazyIframe body={this.state.render || ''} />
          </Col>
        </Row>

      </div>
    );
  }
});

export default TemplateEdit;
