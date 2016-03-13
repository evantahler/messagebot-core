app.controller('analytics:search', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  var section = $rootScope.section;

  $scope.searchResults = [];
  $scope.searchString = '';
  $scope.searchOptions = {
    from: 0,
    size: 100,
    // sort: ?
  };

  $scope.doSearch = function(){
    var searchKeys = [];
    var searchValues = [];
    var parts = $scope.searchString.split(' ');
    parts.forEach(function(part){
      if(part !== ''){
        var words = part.split(':');
        searchKeys.push('data.' + words[0]);
        searchValues.push(words[1]);
      }
    });

    if(searchKeys.length === searchValues.length && searchValues.length > 0){
      $scope.loadSearchResults(searchKeys, searchValues);
    }else{
      ngNotify.set('search query error, try again', 'error');
    }
  };

  $scope.loadSearchResults = function(searchKeys, searchValues){
    $scope.searchResults = [];

    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      searchKeys: searchKeys,
      searchValues: searchValues,
      from: $scope.searchOptions.from,
      size: $scope.searchOptions.size,
      // sort: $scope.searchOptions.sort,
    }, '/api/' + section + '/search', 'GET', function(data){
      if(data.total === 0){
        ngNotify.set('no matching records found', 'error');
      }
      else{
        $scope.searchResults = data[section];
      }
    });
  };

}]);


app.controller('analytics:recent', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  var section = $rootScope.section;
  $scope.recentOptions = {
    from: 0,
    size: 100,
    // sort: ?
  };

  $scope.records = [];

  $scope.loadRecent = function(){
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      searchKeys: 'guid',
      searchValues: '*',
      from: $scope.recentOptions.from,
      size: $scope.recentOptions.size,
      // sort: $scope.recentOptions.sort,
    }, '/api/' + section + '/search', 'GET', function(data){
      $scope.total = data.total;
      $scope.records = data[section];
    });
  };

  $scope.loadRecent();

  // TODO: Why does this fire 2 times?
  $scope.$watch('recentOptions.from', $scope.loadRecent);
  $scope.$watch('recentOptions.size', $scope.loadRecent);

}]);

app.controller('analytics:histogram', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

  var section = $rootScope.section;

  $scope.histogramOptions = {
    interval: 'day',
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

  // TODO: Why does this fire 3 times?
  $scope.$watch('histogramOptions.interval',  $scope.loadHistogram);
  $scope.$watch('histogramOptions.start',     $scope.loadHistogram);
  $scope.$watch('histogramOptions.end',       $scope.loadHistogram);

  $scope.loadHistogram();

}]);
