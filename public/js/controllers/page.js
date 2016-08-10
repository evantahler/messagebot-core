app.controller('pageController', ['$scope', 'ActionHero', '$rootScope', '$location', function($scope, ActionHero, $rootScope, $location){

  $scope.date = new Date();

  ActionHero.action({}, '/api/session', 'PUT', function(data){
    if(data.user){
      $rootScope.user = data.user;

      if($location.path() === '/'){      $location.path('/dashboard'); }
      if($location.path() === '/login'){ $location.path('/dashboard'); }
    }
  }, function(error){
    var matchedAndOK = false;
    var path = $location.path();

    MESSAGEBOT.routes.forEach(function(c){
      if( !matchedAndOK && path === c.route && c.auth === false ){
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
