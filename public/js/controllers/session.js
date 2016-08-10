app.controller('session:create', ['$scope', '$rootScope', '$location', 'ActionHero', function($scope, $rootScope, $location, ActionHero){
  $scope.formData    = {};

  if($rootScope.user){
    $location.path('/dashboard');
  }

  $scope.processForm = function(){
    ActionHero.action($scope.formData, '/api/session', 'POST', function(data){
      if(data.user){ $rootScope.user = data.user; }
      location.reload();
    });
  };
}]);

app.controller('session:destroy', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location){
  $scope.submitForm = function(){
    $scope.processForm.call(this);
  };

  $scope.processForm = function(){
    ActionHero.action({}, '/api/session', 'DELETE', function(data){
      delete $rootScope.user;
      $location.path('/');
    });
  };
}]);
