app.controller('analytics:histogram', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

  var section = $rootScope.section;

  $scope.histogramOptions = {
    interval: 'month',
    start: new Date().setYear( new Date().getFullYear() - 1 ),
    end: new Date().getTime(),
  };

  $scope.possibleIntervals = [ 'year', 'month', 'week', 'day', 'hour', 'minute' ];

  $('.histogramStartDatePicker').datepicker({
    format: {
      toDisplay: function (date, format, language) {
          var d = new Date(date);
          return d.toISOString();
      },
      toValue: function (date, format, language) {
          var d = new Date(date);
          return d.getTime();
      }
    }
  });

  $('.histogramEndDatePicker').datepicker({
    format: {
      toDisplay: function (date, format, language) {
          var d = new Date(date);
          return d.toISOString();
      },
      toValue: function (date, format, language) {
          var d = new Date(date);
          return d.getTime();
      }
    }
  });

  $scope.loadHistogram = function(){
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      searchKeys: 'guid',
      searchValues: '*',
      agg: 'date_histogram',
      interval: $scope.histogramOptions.interval,
      aggField: 'createdAt',
      start: $scope.histogramOptions.start,
      end: $scope.histogramOptions.end,
    }, '/api/' + section + '/aggregation', 'GET', function(data){

      var times = [];
      var counts = [];
       data.value.buckets.forEach(function(bucket){
        times.push(bucket.key_as_string);
        counts.push(bucket.doc_count);
      });

      var chartData = {
        title: {
          text: section,
          align: 'left',
        },
        xAxis: {
          categories: times
        },
        yAxis: {
          title: { text: (section + ' Created') },
        },
        plotOptions: {
          line: {
            dataLabels: { enabled: true },
            enableMouseTracking: true
          }
        },
        tooltip: { valueSuffix: (section + ' created') },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          borderWidth: 1
        },
        series: [
          {name: section, data: counts}
        ]
      };

      // hadck to defer loading to next cycle
      setTimeout(function(){
        $('#histogramChart').highcharts(chartData);
      }, 10);

    });
  };

  $scope.loadHistogram();

  $scope.$watch('histogramOptions.interval',  $scope.loadHistogram);
  $scope.$watch('histogramOptions.start',     $scope.loadHistogram);
  $scope.$watch('histogramOptions.end',       $scope.loadHistogram);

}]);
