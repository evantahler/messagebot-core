app.controller('record:view', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.section = $rootScope.section;                     // people
  $scope.recordType = $rootScope.singular($scope.section); // person

  $scope.guid = $routeParams.guid;
  $scope.newAttribute = {};

  $scope.load = function(){
    $scope.formData = {};
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      guid: $scope.guid
    }, '/api/' + $scope.recordType, 'GET', function(data){
      $scope.record = data[$scope.recordType];
    });
  };

  $scope.updateAttribute = function(key, value){
    if(!value){ value = $scope.record.data[key]; }

    var data = {};
    data[key] = value;
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      guid: $scope.guid,
      data: JSON.stringify(data),
    }, '/api/' + $scope.recordType, 'PUT', function(data){
      $scope.formData = {};
      $scope.record = data[$scope.recordType];
    });
  };

  $scope.deleteAttribute = function(key){
    var data = {};
    data[key] = '_delete';
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      guid: $scope.guid,
      data: JSON.stringify(data),
    }, '/api/' + $scope.recordType, 'PUT', function(data){
      $scope.record = data[$scope.recordType];
    });
  };

  $scope.addAttribute = function(key, value){
    $scope.updateAttribute($scope.newAttribute.key, $scope.newAttribute.value);
    $scope.newAttribute = {};
  };

  $scope.deleteRecord = function(){
    if(confirm('are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {
        userId: $rootScope.user.id,
        guid: $scope.guid,
      }, '/api/' + $scope.recordType, 'DELETE', function(data){
        $location.path('/' + $scope.recordType);
      });
    }
  };

  $scope.load();

}]);
