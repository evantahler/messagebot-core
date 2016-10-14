import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import NotificationSystem from 'react-notification-system';
import Client from './utils/client.jsx';

import Header from './header.jsx';
import Footer from './footer.jsx';

const Page = React.createClass({
  getInitialState: function(){
    return {
      client: new Client(),
      user: {},
      notificationSystem: null,
      navigation: [],
    };
  },

  checkSession: function(){
    const client = this.state.client;
    const location = this.props.location;

    client.action({}, '/api/session', 'PUT', (data) => {
      if(data.user){
        this.setState({user: data.user}, () => {
          this.loadNavigation();
          if(['/', '/home', '/login', '/fogot-password'].indexOf(location.pathname) >= 0){
            document.location.href = '/#/dashboard';
          }
        });
      }else{
        this.loadNavigation();
      }
    }, (error) => {
      this.loadNavigation();
      if(error.toLowerCase().match(/please log in to continue/)){
        document.location.href = '/#/home';
      }else{
        client.notify(error, 'error');
        console.error(error);
      }
    });
  },

  componentWillMount: function(){
    this.checkSession();
  },

  loadNavigation(){
    const client = this.state.client;

    client.action({}, '/api/system/navigation', 'GET', (data) => {
      this.setState({navigation: data.navigation});
    });
  },

  componentDidMount: function(){
    this.setState({notificationSystem: this.refs.notificationSystem});
    this.state.client.setNotificationSystem(this.refs.notificationSystem);
  },

  render: function(){
    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, this.state)
    );

    return(
      <Grid>
        <NotificationSystem ref="notificationSystem" />

        <Row>
          <Col md={12}>
            <Header {...this.state}/>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            {childrenWithProps}
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Footer/>
          </Col>
        </Row>

      </Grid>
    );
  }
});

export default Page;
