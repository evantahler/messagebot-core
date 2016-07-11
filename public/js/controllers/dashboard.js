app.controller('dashboard:realtime', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  $scope.sections  = ['people', 'events', 'messages']
  $scope.sleep     = 5000;
  $scope.timer;
  var searchKeys   = ['guid'];
  var searchValues = ['_exists'];

  $scope.loadHistorgramSection = function(section){
    var start = ( new Date(new Date().getTime() - (1000 * 60 * 60)).getTime() );
    var end   = ( new Date().getTime() );
    var maxPoints = 60 * 60;

    $rootScope.action($scope, {
      maximumSelections: 0,
      selections: [],
      searchKeys: ['guid'],
      searchValues: ['_exists'],
      interval: 'minute',
      start: start,
      end: end,
    }, '/api/' + section + '/aggregation', 'GET', function(data){
      $scope.chart.series.forEach(function(series){
        if(series.name === section){
          data.aggregations._all.forEach(function(e){
            var t = new Date(e.key)
            var lastPoint = series.data[(series.data.length - 1)];
            if(lastPoint && lastPoint.x=== t.getTime()){
              lastPoint.update({x: t.getTime(), y: e.doc_count}, true);
            }else if(series.data.length > maxPoints){
              series.addPoint([t.getTime(), e.doc_count], true, true);
            }else{
              series.addPoint([t.getTime(), e.doc_count], true, false);
            }
          });
        }
      })
    });
  };

  $scope.loadHistogram = function(){
    clearTimeout($scope.timer);
    $scope.loadHistorgramSection('people');
    $scope.loadHistorgramSection('events');
    $scope.loadHistorgramSection('messages');
    $scope.timer = setTimeout($scope.loadHistogram, $scope.sleep);
  };

  var series = [];
  $scope.sections.forEach(function(section){
    series.push({
      name: section,
      data: [],
    });
  });

  var chartData = {
    chart: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      type: 'spline',
      animation: Highcharts.svg, // don't animate in old IE
      events: {
        load: function(){ $scope.chart = this; }
      }
    },
    title: false,
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      title: { text: 'Created At' },
      plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
      floating: true,
    },
    series: series
  };

  // hadck to defer loading to next cycle
  setTimeout(function(){
    $('#realtimeChart').highcharts(chartData);
    $scope.loadHistogram();
  }, 10);

  $scope.$on('$locationChangeStart', function(){
    clearTimeout($scope.timer);
  });

}]);
