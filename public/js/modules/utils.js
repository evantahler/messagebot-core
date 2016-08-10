(function(){

  var module = angular.module('Utils', []);
  module.provider('Utils', UtilsService);

  /* ------------------- */

  function UtilsService(){
    this.$get = [function(){

      return {

        /* Bootstrap Modals */
        clearModals: clearModals = function(name){
          $(name).modal('hide');
          $('body').removeClass('modal-open');
          $('.modal-backdrop').remove();
        },

        /* Searching */
        routeQueryToParams: function(query){
          var topLevelSearchTerms = [
            'type',
            'personGuid',
            'messageGuid',
            'eventGuid',
            'guid',
            'type',
            'createdAt',
            'updatedAt',
            'campaignId',
            'sentAt',
            'openedAt',
            'actedAt',
            'transport',
          ];

          var searchKeys = [];
          var searchValues = [];
          var parts = query.split(' ');
          parts.forEach(function(part){
            if(part !== ''){
              var words = part.split(':');
              if(topLevelSearchTerms.indexOf(words[0]) >= 0){
                searchKeys.push(words[0]);
              }else{
                searchKeys.push('data.' + words[0]);
              }
              searchValues.push(words[1]);
            }
          });

          return [searchKeys, searchValues];
        },

        /* language */
        singular: function(thing){
          if(thing === 'people'){ return 'person'; }
          if(thing === 'events'){ return 'event'; }
          if(thing === 'messages'){ return 'message'; }
          return thing;
        },

        plural: function(thing){
          if(thing === 'person'){ return 'people'; }
          if(thing === 'event'){ return 'events'; }
          if(thing === 'message'){ return 'messages'; }
          return thing;
        },

        determineSection: function($location){
          var pathParts = $location.$$path.split('/');
          if(pathParts[0] === ''){ pathParts.shift(); }
          var section = pathParts[0];
          return this.plural(section);
        },

        /* Pagination */
        genratePagination: function(currentPage, perPage, totalRecords){
          var pageCount = 9; // should be an odd number
          currentPage = parseInt(currentPage);
          var currentId = currentPage * perPage;
          var i;

          var pagination = {
            showBack    : (currentId - (Math.ceil(pageCount/2) * perPage) <= 0) ? false : true,
            showForward : (currentId + (Math.ceil(pageCount/2) * perPage) >= totalRecords) ? false : true,
            firstPage   : 0,
            lastPage    : Math.ceil(totalRecords / perPage) - 1,
            pages: []
          };

          pagination.pages.push({
            page: currentPage, active: true,
          });

          // forward
          for (i = 1; i < Math.ceil(pageCount/2); i++) {
            if((currentPage + i) * perPage < totalRecords){
              pagination.pages.push({
                page: (currentPage + i), active: false,
              });
            }
          }

          // backwards
          for (i = 1; i < Math.ceil(pageCount/2); i++) {
            if((currentPage - i) >= 0){
              pagination.pages.unshift({
                page: (currentPage - i), active: false,
              });
            }
          }

          return pagination;
        },

      };
    }];
  };

})();
