import React from 'react';
import { Glyphicon, Navbar, Nav, MenuItem, NavDropdown, NavItem } from 'react-bootstrap';

const _NavHeaderAndIcon = React.createClass({
  render(){
    let link = '/#/dashboard';
    if(this.props.loggedIn === false){ link = '/#/home'; }

    return(
      <Navbar.Header>
        <Navbar.Brand>
          <a href={link}><img src="/images/logo/logo.png" height="100%" /></a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
    );
  }
});

const _NavGroup = React.createClass({
  render(){
    let group = this.props.group;
    let key = `navDropdown-${group.title}`;
    let loggedIn = this.props.loggedIn;
    let counter = 0;

    // do not render the goup if it is for the other type of user
    if(loggedIn !== group.loggedIn){ return null; }

    let navOpts = {};
    if(group.align === 'right'){ navOpts.pullRight = true; }
    else{ navOpts.pullLeft = true; }

    let title = <span><Glyphicon glyph={group.glyphicon} /> {group.title}</span>;

    return(
      <Nav {...navOpts} key={key} >
        <NavDropdown title={title} id={key} >
          {
            group.elements.map((element) => {
              let label = <MenuItem divider />;
              counter++;

              if(element.divider === true){
                return <MenuItem divider key={`${key}_${counter}`} />;
              }

              return(
                <MenuItem href={element.route} key={`${key}_${counter}`} >
                  <span><Glyphicon glyph={element.glyphicon} /> {element.title}</span>
                </MenuItem>
              );
            }
          )}
        </NavDropdown>
      </Nav>
    );
  }
});

const Header = React.createClass({
  render(){
    let counter = 0;
    let loggedIn = this.props.user.id ? true : false;

    return(
      <div>
        <br />

        <Navbar>
          <_NavHeaderAndIcon loggedIn={loggedIn} />
          <Navbar.Collapse>
            <Nav pullRight> </Nav>
            {
              this.props.navigation.map((group) => {
                counter++;
                return (
                  <_NavGroup key={counter} group={group} loggedIn={loggedIn}></_NavGroup>
                );
              })
            }
          </Navbar.Collapse>
        </Navbar>

      </div>
    );
  }
});

export default Header;
