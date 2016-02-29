app.controller('user:create', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location){
  $scope.formData    = {};
  $scope.processForm = function(){
    $scope.formData.teamId = $rootScope.team.id;
    $rootScope.authenticatedActionHelper($scope, $scope.formData, '/api/user', 'POST', function(data){
      location.reload();
    });
  };
}]);

app.controller('user:list', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

}]);

app.controller('user:edit', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

  $rootScope.authenticatedActionHelper($scope, {userId: $rootScope.user.id}, '/api/user/statuses', 'GET', function(data){
    $scope.validStatuses = data.validStatuses;
  });

  $rootScope.authenticatedActionHelper($scope, {userId: $rootScope.user.id}, '/api/user', 'GET', function(data){
    $scope.formData = data.user;
  });

  $scope.processForm = function(){
    $scope.formData.userId = $rootScope.user.id;
    $rootScope.authenticatedActionHelper($scope, $scope.formData, '/api/user', 'PUT', function(data){
      if(data.user){
        ngNotify.set('Account Updated', 'success');
        $rootScope.user = data.user;
        $scope.formData = data.user;
      }
    });
  };
}]);
