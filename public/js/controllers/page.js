app.controller('pageController', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location){

  $scope.date = new Date();

  $rootScope.action($scope, {}, '/api/session', 'PUT', function(data){
    if(data.user){
      $rootScope.user      = data.user;

      if($location.path() === '/'){      $location.path('/dashboard'); }
      if($location.path() === '/login'){ $location.path('/dashboard'); }
    }
  }, function(error){
    var matchedAndOK = false;
    var path = $location.path();

    $rootScope.routes.forEach(function(r){
      if( !matchedAndOK && path === r[0] && r[3] === false ){
        matchedAndOK = true;
      }
    });

    if(matchedAndOK){
      // OK to be here logged-out
    }else{
      $location.path('/');
    }
  });

  $scope.getNavigationHighlight = function(path){
    var parts = $location.path().split('/');
    var pathParts = path.split('/');

    parts.shift(); /// throw away the first one

    var simplePathParts = [];
    while(pathParts.length > 0 && parts.length > 0){
      pathParts.pop();
      simplePathParts.push( parts.shift() );
    }

    if(simplePathParts.join('/') === path){
      return "active";
    }else{
      return "";
    }
  };

}]);
