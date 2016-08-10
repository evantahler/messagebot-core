app.controller('settings', ['$scope', '$rootScope', '$location', 'ActionHero', function($scope, $rootScope, $location, ActionHero){
  $scope.transports = {};

  $scope.loadTransports = function(){
    ActionHero.action({}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;
    });
  };

  $scope.loadTransports();
}]);
