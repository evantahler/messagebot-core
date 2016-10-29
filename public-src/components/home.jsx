import React from 'react';
import { Row, Col, Jumbotron } from 'react-bootstrap';

import SessionCreate      from './session/create.jsx';
import UserForgotPassword from './user/forgotPassword.jsx';

const Home = React.createClass({
  render(){
    return(
      <Row>
        <Col md={12}>
           <Jumbotron>
             <Row>
               <Col md={2}>
                 <img className="hover_robot" src="/public/images/logo/logo.png" width="100%" />
               </Col>
               <Col md={10}>
                 <h1>MessageBot</h1>
                 <p>A future-proof customer relationship and analytics platform that gows with you!</p>
               </Col>
             </Row>
           </Jumbotron>
        </Col>

        <Col md={6}><SessionCreate {...this.props} /></Col>
        <Col md={6}><UserForgotPassword {...this.props} /></Col>
      </Row>
    );
  }
});

export default Home;
