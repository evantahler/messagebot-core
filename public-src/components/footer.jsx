import React from 'react';

const Footer = React.createClass({
  getInitialState: function(){
    return { date: new Date() };
  },

  render: function(){
    return(
      <footer id="footer-container">
        <hr />
        <div className="row">

          <div className="col-md-6">
            <p className="text-muted">
              { String.fromCharCode(169) + ' MessageBot, ' + this.state.date.getFullYear() }
            </p>
          </div>

          <div className="col-md-6"></div>

        </div>
      </footer>
    );
  }
});

export default Footer;
