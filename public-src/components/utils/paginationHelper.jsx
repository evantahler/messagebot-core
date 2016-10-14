import React from 'react';
import { Pagination, Well } from 'react-bootstrap';
import { browserHistory } from 'react-router';

const PaginationHelper = React.createClass({
  // this.props.currentPage => What page are we on?
  // this.props.total       => The total number of items we are paginating
  // this.props.perPage     => How many items are shown per page?

  handleSelect: function(page){
    const location = this.props.location;
    let parts = location.pathname.split('/');
    if(parts[(parts.length - 1)] === ''){ parts.pop(); }
    let lastPart = parts[(parts.length - 1)];
    let newPathname = '';
    if(!isNaN(lastPart)){ parts.pop(); }

    newPathname = parts.join('/');
    newPathname += '/' + (page - 1);

    // TODO: how to do this without a full-page reload?
    // componants were not getting the prop change event :(
    // browserHistory.push(`/#${newPathname}`);
    window.location.href = `/#${newPathname}`;
  },

  render: function(){
    const currentPage    = parseInt(this.props.currentPage || 0);
    const lastItemOnPage = this.props.perPage * (currentPage + 1);
    const lastPage       = Math.ceil(this.props.total / this.props.perPage) - 1;

    if(this.props.total === 0){ return null; }
    if(lastPage === 0){ return null; }

    return(
      <div>
        <Well>
          <Pagination
            prev={currentPage === 0 ? false : true}
            first={currentPage === 0 ? false : true}
            next={lastPage > currentPage ? true : false }
            last={lastPage > currentPage ? true : false }
            ellipsis
            items={(lastPage + 1)}
            maxButtons={5}
            activePage={(currentPage + 1)}
            onSelect={this.handleSelect}
          />
        </Well>
    </div>
  );
  }
});

export default PaginationHelper;
