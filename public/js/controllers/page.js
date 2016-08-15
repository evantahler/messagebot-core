var MESSAGEBOT = MESSAGEBOT || {};

app.controller('pageController', ['$scope', 'ActionHero', 'User', '$location', function($scope, ActionHero, User, $location){

  $scope.date = new Date();
  $scope.navigation = MESSAGEBOT.navigation;
  $scope.user;

  ActionHero.action({}, '/api/session', 'PUT', function(data){
    if(data.user){
      User.setUser(data.user);
      $scope.user = User.getUser();

      if($location.path() === '/'){      $location.path('/dashboard'); }
      if($location.path() === '/login'){ $location.path('/dashboard'); }
    }
  }, function(error){
    var matchedAndOK = false;
    var path = $location.path();

    MESSAGEBOT.routes.forEach(function(c){
      if(!matchedAndOK && path === c.route && c.auth === false){
        matchedAndOK = true;
      }
    });

    if(matchedAndOK){
      // OK to be here logged-out
    }else{
      $location.path('/');
    }
  });

  $scope.getNavigationHighlight = function(item){
    var active = false;
    var path = $location.$$path;

    if(item.elements){
      item.elements.forEach(function(element){
        var childResponse = $scope.getNavigationHighlight(element);
        if(childResponse === 'active'){ active = true; }
      });
    }else if(item.highlights){
      item.highlights.forEach(function(highlight){
        var regexp = new RegExp(highlight);
        if(path.match(regexp)){ active = true; }
      });
    }

    return (active ? 'active' : '');
  };

}]);
