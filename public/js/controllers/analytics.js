app.controller('analytics:search', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  var section = $rootScope.section;

  $scope.searchResults = [];
  $scope.query = $routeParams.query || '';
  $scope.pagination = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.doSearch = function(){
    $location.path( '/' + section + '/search/' + $scope.query + '/' + currentPage );

    var r = $rootScope.routeQueryToParams($scope.query);
    var searchKeys = r[0]; var searchValues = r[1];

    if(searchKeys.length === searchValues.length && searchValues.length > 0){
      $scope.loadSearchResults(searchKeys, searchValues);
    }else{
      $location.path( '/' + section + '/search/' );
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
  $scope.heatmapOptions = {size: 10000};
  $scope.map = {
    center: {
      lat: 0,
      lng: 0,
      zoom: 3
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

  var searchKeys = ['location'];
  var searchValues = ['_exists'];
  if($scope.query){
    var r = $rootScope.routeQueryToParams($scope.query);
    searchKeys = searchKeys.concat(r[0]);
    searchValues = searchValues.concat(r[1]);
  }

  $scope.loadHeatmap = function(){
    $scope.map.layers.overlays = {};
    $rootScope.action($scope, {
      searchKeys: searchKeys,
      searchValues: searchValues,
      from: 0,
      size: $scope.heatmapOptions.size,
    }, '/api/' + section + '/search', 'GET', function(data){
      var points = [];
      var avgLat = 0;
      var avgLon = 0;
      data[section].forEach(function(e){
        avgLat += e.location.lat;
        avgLon += e.location.lon;
        points.push([e.location.lat, e.location.lon])
      });

      avgLat = avgLat / data[section].length;
      avgLon = avgLon / data[section].length;

      $scope.map.center.lat = avgLat;
      $scope.map.center.lon = avgLon;
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
    selections: {},
  };

  $scope.possibleIntervals = [ 'year', 'month', 'week', 'day', 'hour', 'minute' ];

  var searchKeys = ['guid'];
  var searchValues = ['_exists'];
  if($scope.query){
    var r = $rootScope.routeQueryToParams($scope.query);
    searchKeys = searchKeys.concat(r[0]);
    searchValues = searchValues.concat(r[1]);
  }

  $scope.loadHistogram = function(){
    var selections = [];
    Object.keys($scope.histogramOptions.selections).forEach(function(k){
      if($scope.histogramOptions.selections[k] === true){ selections.push(k); }
    });

    $rootScope.action($scope, {
      maximumSelections: 10,
      selections: selections,
      searchKeys: searchKeys,
      searchValues: searchValues,
      interval: $scope.histogramOptions.interval,
      start: $scope.histogramOptions.start.getTime(),
      end: $scope.histogramOptions.end.getTime(),
    }, '/api/' + section + '/aggregation', 'GET', function(data){
      $scope.histogramOptions.selectionsName = data.selectionsName;
      data.selections.forEach(function(aggName){
        $scope.histogramOptions.selections[aggName] = false;
      });

      var series = [];
      Object.keys(data.aggregations).forEach(function(aggName){
        var seriesData;
        if(aggName !== '_all'){
          seriesData = {
            name: aggName,
            type: 'column',
            data: []
          };

          $scope.histogramOptions.selections[aggName] = true;
        }else{
          seriesData = {
            name: '*Total',
            type: 'spline',
            dashStyle: 'LongDash',
            lineWidth: 4,
            color: '#CCCCCC',
            data: []
          };
        }

        data.aggregations[aggName].forEach(function(e){
          seriesData.data.push({x: new Date(e.key), y: e.doc_count});
        });
        series.push(seriesData);
      });

      console.log($scope.histogramOptions);

      var chartData = {
        chart: {
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
