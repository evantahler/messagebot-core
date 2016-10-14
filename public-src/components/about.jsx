import React from 'react';

const About = React.createClass({
  render: function(){
    return(
      <div>
        <h1>ABOUT PAGE</h1>
        <p>MessageBot is a cool thing.</p>
        <p>Visit <a href="http://messagebot.io">MessageBot.io</a> to learn more.</p>
      </div>
    );
  }
});

export default About;
