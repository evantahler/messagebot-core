/////////////////
// APPLICATION //
/////////////////

var app = angular.module('app', ['ngRoute', 'ngNotify', 'angularFileUpload', 'ui.ace', 'ui.bootstrap.datetimepicker']);

app.config(function($routeProvider, $locationProvider){

  routes.forEach(function(collection){
    var route = collection[0];
    var page  = collection[1];
    var title = collection[2];
    $routeProvider.when(route, {
      'templateUrl': page,
      'pageTitle': title
    });
  });

  // $locationProvider.html5Mode(true);
});

app.run(['$rootScope', '$http', 'ngNotify', function($rootScope, $http, ngNotify){

  $rootScope.user    = null;
  $rootScope.team    = null;
  $rootScope.billing = {};
  $rootScope.routes  = routes;

  ngNotify.config({
    theme: 'pure',
    position: 'bottom',
    duration: 3000,
    type: 'info',
    sticky: false,
    button: true,
    html: false
  });

  $rootScope.clearModals = function(name){
    $(name).modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  };

  $rootScope.authenticatedActionHelper = function($scope, data, path, verb, successCallback, errorCallback){
    if(!$rootScope.csrfToken){
      setTimeout(function(){
        console.log('await csrfToken for ' + path);
        $rootScope.authenticatedActionHelper($scope, data, path, verb, successCallback, errorCallback);
      }, 1000);
    }else{
      $rootScope.actionHelper($scope, data, path, verb, successCallback, errorCallback);
    }
  };

  $rootScope.actionHelper = function($scope, data, path, verb, successCallback, errorCallback){
    var i;

    $('button').prop('disabled', true);

    if(typeof successCallback !== 'function'){
      successCallback = function(data){
        var successMessage = 'OK!';
        if(data.message){ successMessage = data.message; }
        ngNotify.set(successMessage, 'success');
      };
    }

    if(typeof errorCallback !== 'function'){
      errorCallback = function(errorMessage){ ngNotify.set(errorMessage, 'error'); };
    }

    if(!data.csrfToken){ data.csrfToken = $rootScope.csrfToken; }

    for(i in data){
      if(data[i] === null || data[i] === undefined){ delete data[i]; }
    }

    if(Object.keys(data).length > 0 && (verb === 'get' || verb === 'GET') && path.indexOf('?') < 0){
      path += '?';
      for(i in data){ path += i + '=' + data[i] + '&'; }
    }

    $http({
      method  : verb,
      url     : path,
      data    : $.param(data),  // pass in data as strings
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
     }).success(function(data){
       $('button').prop('disabled', false);
      successCallback(data);
    }).catch(function(data){
      var errorMessage = '';
      if(data.data && data.data.error){
        errorMessage = data.data.error;
      }else{
        errorMessage = data.statusText + ' | ' + data.status;
      }
      errorCallback(errorMessage);
      setTimeout(function(){
        $('button').prop('disabled', false);
      }, 500);
    });
  };

  $rootScope.singular = function(thing){
    if(thing === 'people'){ return 'person'; }
    if(thing === 'events'){ return 'event'; }
    if(thing === 'messages'){ return 'message'; }
  };

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
