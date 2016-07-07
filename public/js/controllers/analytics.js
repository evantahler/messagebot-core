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
      searchKeys: 'guid',
      searchValues: '_exists',
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

app.controller('analytics:heatmap', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  var section = $rootScope.section;
  $scope.heatmapOptions = {size: 1000};
  $scope.map = {
    center: {
      lat: 39.691949,
      lng: -96.577517,
      zoom: 4
    },
    layers: {
      baselayers: {
        osm: {
          name: 'OpenStreetMap',
          type: 'xyz',
          url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          layerOptions: {
            subdomains: ['a', 'b', 'c'],
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            continuousWorld: true
          }
        }
      }
    }
  };

  $scope.loadHeatmap = function(){
    $scope.map.layers.overlays = {};
    $rootScope.action($scope, {
      searchKeys: 'location',
      searchValues: '_exists',
      from: 0,
      size: $scope.heatmapOptions.size,
    }, '/api/' + section + '/search', 'GET', function(data){
      var points = [];
      data[section].forEach(function(e){
        points.push([e.location.lat, e.location.lon])
      });

      $scope.map.layers.overlays = {
        heat: {
          name: 'Heat Map',
          type: 'heat',
          data: points,
          layerOptions: { radius: 20, blur: 10 },
          visible: true
        }
      };
    });
  }

  $scope.loadHeatmap();
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
          type: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        plotOptions: {
          column: {
            stacking: 'normal',
          }
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
          stackLabels: {
            enabled: true,
            style: {
              fontWeight: 'bold',
              color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
            }
          }
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
