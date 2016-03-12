app.controller('people:histogram', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

  $rootScope.authenticatedActionHelper($scope, {
    userId: $rootScope.user.id,
    searchKeys: 'guid',
    searchValues: '*',
    agg: 'date_histogram',
    interval: 'day',
    aggField: 'createdAt',
  }, '/api/people/aggregation', 'GET', function(data){

    var times = [];
    var counts = [];
     data.value.buckets.forEach(function(bucket){
      times.push(bucket.key_as_string);
      counts.push(bucket.doc_count);
    });

    var chartData = {
      title: {
        text: 'People',
        align: 'left',
      },
      xAxis: {
        categories: times
      },
      yAxis: {
        title: { text: 'People Created' },
      },
      plotOptions: {
        line: {
          dataLabels: { enabled: true },
          enableMouseTracking: true
        }
      },
      tooltip: { valueSuffix: ' people created' },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        borderWidth: 1
      },
      series: [
        {name: 'people', data: counts}
      ]
    };

    // hadck to defer loading to next cycle
    setTimeout(function(){
      $('#histogramChart').highcharts(chartData);
    }, 10);

  });

}]);
