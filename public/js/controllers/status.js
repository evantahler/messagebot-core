app.controller('status:view', ['$scope', '$rootScope', '$location', 'ActionHero', function($scope, $rootScope, $location){
  $scope.loadStatus = function(){
    ActionHero.action({}, '/api/system/status', 'GET', function(data){
      $scope.status = data;

      $scope.status.node.bootedAgo = moment(new Date().getTime() - $scope.status.node.uptime).fromNow();

      $scope.status.redis.tasks.memoryPercent = Math.round($scope.status.redis.tasks.used_memoryMB / $scope.status.redis.tasks.total_system_memoryMB * 100) / 100;
      $scope.status.redis.client.memoryPercent = Math.round($scope.status.redis.client.used_memoryMB / $scope.status.redis.client.total_system_memoryMB * 100) / 100;
    });
  };

  $scope.loadStatus();
}]);
