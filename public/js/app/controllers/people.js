app.controller('people:init', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  $rootScope.section = 'people';
}]);

app.controller('person:view', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.guid = $routeParams.guid;
  $scope.newAttribute = {};

  $scope.load = function(){
    $scope.formData = {};
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      guid: $scope.guid
    }, '/api/person', 'GET', function(data){
      $scope.person = data.person;
    });
  };

  $scope.updateAttribute = function(key, value){
    if(!value){ value = $scope.person.data[key]; }

    var data = {};
    data[key] = value;
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      guid: $scope.guid,
      data: JSON.stringify(data),
    }, '/api/person', 'PUT', function(data){
      $scope.formData = {};
      $scope.person = data.person;
    });
  };

  $scope.deleteAttribute = function(key){
    var data = {};
    data[key] = '_delete';
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      guid: $scope.guid,
      data: JSON.stringify(data),
    }, '/api/person', 'PUT', function(data){
      $scope.person = data.person;
    });
  };

  $scope.addAttribute = function(key, value){
    $scope.updateAttribute($scope.newAttribute.key, $scope.newAttribute.value);
    $scope.newAttribute = {};
  };

  $scope.deletePerson = function(){
    if(confirm('are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {
        userId: $rootScope.user.id,
        guid: $scope.guid,
      }, '/api/person', 'DELETE', function(data){
        $location.path('/people');
      });
    }
  };

  $scope.load();

}]);
