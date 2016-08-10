app.controller('analytics:search', ['$scope', '$location', 'ngNotify', '$routeParams', 'ActionHero', 'Utils', function($scope, $location, ngNotify, $routeParams, ActionHero, Utils){
  $scope.section = Utils.determineSection($location); // people
  $scope.recordType = Utils.singular($scope.section); // person
  $scope.searchResults = [];
  $scope.query = $routeParams.query || '';
  $scope.pagination = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.doSearch = function(){
    $location.path( '/' + $scope.section + '/search/' + $scope.query + '/' + currentPage );

    var r = Utils.routeQueryToParams($scope.query);
    var searchKeys = r[0]; var searchValues = r[1];

    if(searchKeys.length === searchValues.length && searchValues.length > 0){
      $scope.loadSearchResults(searchKeys, searchValues);
    }else{
      $location.path( '/' + $scope.section + '/search/' );
      ngNotify.set('search query error, try again', 'error');
    }
  };

  $scope.loadSearchResults = function(searchKeys, searchValues){
    $scope.searchResults = [];

    ActionHero.action({
      searchKeys: searchKeys,
      searchValues: searchValues,
      from: (currentPage * perPage),
      size: perPage,
    }, '/api/' + $scope.section + '/search', 'GET', function(data){
      if(data.total === 0){
        ngNotify.set('no matching records found', 'error');
      }
      else{
        $scope.total = data.total;
        $scope.searchResults = data[$scope.section];
        $scope.pagination = Utils.genratePagination(currentPage, perPage, $scope.total);

        if($scope.total > 0 && $scope.searchResults.length === 0){
          $location.path( '/' + $scope.section + '/search/' + $scope.query );
        }
      }
    });
  };

  if($scope.query && $scope.query != ''){
    $scope.doSearch();
  }

}]);


app.controller('analytics:recent', ['$scope', '$location', '$routeParams', 'ActionHero', 'Utils', function($scope, $location, $routeParams, ActionHero, Utils){
  $scope.section = Utils.determineSection($location); // people
  $scope.recordType = Utils.singular($scope.section); // person
  $scope.records = [];
  $scope.pagination = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.loadRecent = function(){
    ActionHero.action({
      searchKeys: 'guid',
      searchValues: '_exists',
      from: (currentPage * perPage),
      size: perPage,
    }, '/api/' + $scope.section + '/search', 'GET', function(data){
      $scope.total = data.total;
      $scope.records = data[$scope.section];
      $scope.pagination = Utils.genratePagination(currentPage, perPage, $scope.total);
    });
  };

  $scope.loadRecent();
}]);

app.controller('analytics:heatmap', ['$scope', '$location', '$routeParams', 'ActionHero', 'Utils', function($scope, $location, $routeParams, ActionHero, Utils){
  $scope.section = Utils.determineSection($location); // people
  $scope.recordType = Utils.singular($scope.section); // person
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
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
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
    var r = Utils.routeQueryToParams($scope.query);
    searchKeys = searchKeys.concat(r[0]);
    searchValues = searchValues.concat(r[1]);
  }

  $scope.loadHeatmap = function(){
    $scope.map.layers.overlays = {};
    ActionHero.action({
      searchKeys: searchKeys,
      searchValues: searchValues,
      from: 0,
      size: $scope.heatmapOptions.size,
    }, '/api/' + $scope.section + '/search', 'GET', function(data){
      var points = [];
      var avgLat = 0;
      var avgLon = 0;
      data[$scope.section].forEach(function(e){
        avgLat += e.location.lat;
        avgLon += e.location.lon;
        points.push([e.location.lat, e.location.lon])
      });

      avgLat = avgLat / data[$scope.section].length;
      avgLon = avgLon / data[$scope.section].length;

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

app.controller('analytics:histogram', ['$scope', '$location', 'ActionHero', 'Utils', function($scope, $location, ActionHero, Utils){
  $scope.section = Utils.determineSection($location); // people
  $scope.recordType = Utils.singular($scope.section); // person

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
    var r = Utils.routeQueryToParams($scope.query);
    searchKeys = searchKeys.concat(r[0]);
    searchValues = searchValues.concat(r[1]);
  }

  $scope.loadHistogram = function(){
    var selections = [];
    Object.keys($scope.histogramOptions.selections).forEach(function(k){
      if($scope.histogramOptions.selections[k] === true){ selections.push(k); }
    });

    ActionHero.action({
      maximumSelections: 10,
      selections: selections,
      searchKeys: searchKeys,
      searchValues: searchValues,
      interval: $scope.histogramOptions.interval,
      start: $scope.histogramOptions.start.getTime(),
      end: $scope.histogramOptions.end.getTime(),
    }, '/api/' + $scope.section + '/aggregation', 'GET', function(data){
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
          text: $scope.section,
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
          tickPixelInterval: 150
        },
        yAxis: {
          title: { text: ($scope.section + ' created') },
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
