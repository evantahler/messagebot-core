app.controller('analytics:search', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  var section = $rootScope.section;

  var topLevelSearchTerms = [
    'type',
    'personGuid',
    'messageGuid',
    'eventGuid',
    'guid',
    'type',
    'createdAt',
    'updatedAt',
    'campaignId',
    'sentAt',
    'openedAt',
    'actedAt',
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

    $rootScope.action($scope, {
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
    $rootScope.action($scope, {
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
    $rootScope.action($scope, {
      interval: $scope.histogramOptions.interval,
      start: $scope.histogramOptions.start.getTime(),
      end: $scope.histogramOptions.end.getTime(),
    }, '/api/' + section + '/aggregation', 'GET', function(data){

      var series = [];
      Object.keys(data.aggregations).forEach(function(aggName){
        var seriesData = {name: aggName, data: []};
        data.aggregations[aggName].forEach(function(e){
          seriesData.data.push({x: new Date(e.key), y: e.doc_count});
        });

        series.push(seriesData);
      });

      var chartData = {
        chart: {
          type: 'spline',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        title: {
          text: section,
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
          tickPixelInterval: 150
        },
        yAxis: {
          title: { text: (section + ' created') },
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
        $('#histogramChart').highcharts(chartData);
      }, 10);

    });
  };

  $scope.loadHistogram();
}]);
