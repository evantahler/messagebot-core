app.controller('session:create', ['$scope', 'User', '$location', 'ActionHero', function($scope, User, $location, ActionHero){
  $scope.formData = {};
  $scope.user = User.getUser();

  if($scope.user){
    $location.path('/dashboard');
  }

  $scope.processForm = function(){
    ActionHero.action($scope.formData, '/api/session', 'POST', function(data){
      if(data.user){ User.setUser(data.user); }
      window.location.reload();
    });
  };
}]);

app.controller('session:destroy', ['$scope', 'User', '$location', 'ActionHero', function($scope, User, $location, ActionHero){
  $scope.submitForm = function(){
    $scope.processForm.call(this);
  };

  $scope.processForm = function(){
    ActionHero.action({}, '/api/session', 'DELETE', function(data){
      User.clear();
      $location.path('/');
      setTimeout(function(){ window.location.reload(); }, 100);
    });
  };
}]);
