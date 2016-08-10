app.controller('settings', ['$scope', 'ActionHero', function($scope, ActionHero){
  $scope.transports = {};

  $scope.loadTransports = function(){
    ActionHero.action({}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;
    });
  };

  $scope.loadTransports();
}]);
