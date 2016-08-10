var app;

app = angular.module('MessageBot', [
  'ngRoute',
  'ngNotify',
  'angularFileUpload',
  'ui.ace',
  'ui.bootstrap.datetimepicker',
  'jsonFormatter',
  'leaflet-directive',
  'ActionHero',
  'User',
  'Utils',
]);

app.config(function($routeProvider, $locationProvider, $logProvider){
  $logProvider.debugEnabled(false);
  // $locationProvider.html5Mode(true);

  /* HighCharts */
  Highcharts.setOptions({
    global: { useUTC: false },
    credits: { enabled: false }
  });

  MESSAGEBOT.routes.forEach(function(c){
    $routeProvider.when(c.route, {
      'templateUrl': c.page,
      'pageTitle': c.title
    });
  });
});

app.run(['$rootScope', 'ngNotify', function($rootScope, ngNotify){
  /* NG-Notify */
  ngNotify.config({
    theme: 'pure',
    position: 'bottom',
    duration: 3000,
    type: 'info',
    sticky: false,
    button: true,
    html: false
  });

  $rootScope.$on('$routeChangeSuccess', function (event, current, previous){
    $rootScope.pageTitle = current.$$route.pageTitle;
  });

}]);
