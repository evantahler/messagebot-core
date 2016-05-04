app.controller('analytics:search', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  var section = $rootScope.section;

  var topLevelSearchTerms = [
    'type',
    'personGuid',
    'guid',
    'type',
    'createdAt',
    'updatedAt',
  ];

  $scope.searchResults = [];
  $scope.query = $routeParams.query || '';
  $scope.pagination = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.doSearch = function(){
    $location.path( '/' + section + '/search/' + $scope.query + '/' + currentPage );

    var searchKeys = [];
    var searchValues = [];
    var parts = $scope.query.split(' ');
    parts.forEach(function(part){
      if(part !== ''){
        var words = part.split(':');
        if(topLevelSearchTerms.indexOf(words[0]) >= 0){
          searchKeys.push(words[0]);
        }else{
          searchKeys.push('data.' + words[0]);
        }
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
      from: (currentPage * perPage),
      size: perPage,
    }, '/api/' + section + '/search', 'GET', function(data){
      if(data.total === 0){
        ngNotify.set('no matching records found', 'error');
      }
      else{
        $scope.total = data.total;
        $scope.searchResults = data[section];
        $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);

        if($scope.total > 0 && $scope.searchResults.length === 0){
          $location.path( '/' + section + '/search/' + $scope.query );
        }
      }
    });
  };

  if($scope.query && $scope.query != ''){
    $scope.doSearch();
  }

}]);


app.controller('analytics:recent', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  var section = $rootScope.section;
  $scope.records = [];
  $scope.pagination = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.loadRecent = function(){
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      searchKeys: 'guid',
      searchValues: '*',
      from: (currentPage * perPage),
      size: perPage,
    }, '/api/' + section + '/search', 'GET', function(data){
      $scope.total = data.total;
      $scope.records = data[section];
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);
    });
  };

  $scope.loadRecent();
}]);

app.controller('analytics:histogram', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

  var section = $rootScope.section;

  $scope.histogramOptions = {
    interval: 'day',
    start: new Date(new Date().setMonth( new Date().getMonth() - 1 )),
    end: new Date(),
  };

  $scope.possibleIntervals = [ 'year', 'month', 'week', 'day', 'hour', 'minute' ];

  $scope.loadHistogram = function(){
    $rootScope.authenticatedActionHelper($scope, {
      userId: $rootScope.user.id,
      searchKeys: 'guid',
      searchValues: '*',
      agg: 'date_histogram',
      interval: $scope.histogramOptions.interval,
      aggField: 'createdAt',
      start: $scope.histogramOptions.start.getTime(),
      end: $scope.histogramOptions.end.getTime(),
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
        // tooltip: { valueSuffix: (section + ' created') },
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
}]);
