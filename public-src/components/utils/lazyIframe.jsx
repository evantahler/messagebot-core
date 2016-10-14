import React from 'react';
import { Button, Modal } from 'react-bootstrap';

const LazyIframe = React.createClass({
  getInitialState(){
    return {
      showModal: false,
    };
  },

  sanitizedBody(){
    let body = this.props.body;

    // set all verbs for image tracking to "test"
    body = body.replace(/\/api\/message\/track.gif\?verb=read/g, '/api/message/track.gif?verb=test');
    body = body.replace(/\/api\/message\/track.gif\?verb=act/g, '/api/message/track.gif?verb=test');
    body = body.replace(/\/api\/message\/track.gif\?verb=read/g, '/api/message/track.gif?verb=test');

    // add padding without manipulating CSS below
    body += '<br />';

    return body;
  },

  showModal(){
    this.setState({showModal: true});
  },

  hideModal(){
    this.setState({showModal: false});
  },

  render(){
    if(!this.props.body || this.props.body === ''){
      return null;
    }

    setTimeout(() => {
      let body = this.sanitizedBody();

      ['bodyIframe', 'modalIframe'].forEach(function(div){
        const iframe = document.getElementById(div);
        if(iframe){
          iframe.contentWindow.document.open();
          iframe.contentWindow.document.write(body);
          iframe.contentWindow.document.close();

          const height = iframe.contentWindow.document.body.offsetHeight;
          iframe.style.height = `${(height)}px`;
        }
      });
    }, 100);

    return(
      <div>
        <iframe id="bodyIframe" scrolling="auto" frameBorder="0" width="100%" height="100%" />
        <hr />
        <Button onClick={this.showModal}>Show Full Screen</Button>

        <Modal dialogClassName="wide-iframe" show={this.state.showModal} onHide={this.hideModal}>
          <Modal.Body>
            <iframe id="modalIframe" scrolling="auto" frameBorder="0" width="100%" height="100%" />
          </Modal.Body>
        </Modal>
      </div>
    );
  }
});

export default LazyIframe;
