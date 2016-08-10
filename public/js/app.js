var app;

(function(){

  app = angular.module('MessageBot', [
    'ngRoute',
    'ngNotify',
    'angularFileUpload',
    'ui.ace',
    'ui.bootstrap.datetimepicker',
    'jsonFormatter',
    'leaflet-directive',
    'ActionHero'
  ]);

  app.config(function($routeProvider, $locationProvider, $logProvider){
    $logProvider.debugEnabled(false);
    // $locationProvider.html5Mode(true);

    MESSAGEBOT.routes.forEach(function(c){
      $routeProvider.when(c.route, {
        'templateUrl': c.page,
        'pageTitle': c.title
      });
    });
  });

  app.run(['$rootScope', 'ngNotify', function($rootScope, ngNotify){
    $rootScope.user        = null;
    $rootScope.team        = null;
    $rootScope.billing     = {};

    /* NG-Notify */
    ngNotify.config({
      theme: 'pure',
      position: 'bottom',
      duration: 3000,
      type: 'info',
      sticky: false,
      button: true,
      html: false
    });

    /* HighCharts */
    Highcharts.setOptions({
      global: { useUTC: false },
      credits: { enabled: false }
    });

    /* Bootstrap Modals */
    $rootScope.clearModals = function(name){
      $(name).modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    };

    /* Searching */
    $rootScope.routeQueryToParams = function(query){
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
    };

    $rootScope.singular = function(thing){
      if(thing === 'people'){ return 'person'; }
      if(thing === 'events'){ return 'event'; }
      if(thing === 'messages'){ return 'message'; }
    };

    /* Pagination */
    $rootScope.genratePagination = function(currentPage, perPage, totalRecords){
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
    };

    $rootScope.$on('$routeChangeSuccess', function (event, current, previous){
      $rootScope.pageTitle = current.$$route.pageTitle;
    });

  }]);

})();
