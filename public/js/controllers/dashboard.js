var moment = moment || {};

app.controller('dashboard:view', ['$scope', 'ngNotify', 'ActionHero', function($scope, ngNotify, ActionHero){
  $scope.sections  = [
    'people',
    'events',
    'messages'
  ];

  $scope.ranges = {};
  $scope.stats = {};
  $scope.refreshInterval = '0';
  $scope.timer;
  $scope.campaigns = {};
  $scope.campaignFunnels = {};

  $scope.loadStatus = function(){
    ActionHero.action({}, '/api/system/status', 'GET', function(data){
      $scope.status = data;
    });
  };

  $scope.loadStats = function(){

    $scope.ranges = {
      'Today':      {start: (moment().startOf('day')),   end: moment()},
      'This Week':  {start: (moment().startOf('week')),  end: moment()},
      'This Month': {start: (moment().startOf('month')), end: moment()},
      'This Year':  {start: (moment().startOf('year')),  end: moment()},
    };

    $scope.sections.forEach(function(section){
      Object.keys($scope.ranges).forEach(function(range){
        ActionHero.action({
          maximumSelections: 0,
          selections: [],
          searchKeys: ['guid'],
          searchValues: ['_exists'],
          interval: 'year',
          start: $scope.ranges[range].start.valueOf(),
          end: $scope.ranges[range].end.valueOf(),
        }, '/api/' + section + '/aggregation', 'GET', function(data){
          var value = 0;
          if(data.aggregations._all.length > 0){
            value = data.aggregations._all[0].doc_count;
          }

          if(!$scope.stats[range]){ $scope.stats[range] = {}; }
          $scope.stats[range][section] = value;
        });

      });
    });
  };

  $scope.loadHistorgramSection = function(section){
    var start = (new Date(new Date().getTime() - (1000 * 60 * 60)).getTime());
    var end   = (new Date().getTime());
    var maxPoints = 60 * 60;

    ActionHero.action({
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
          var seriesData = [];
          data.aggregations._all.forEach(function(e){
            seriesData.push([e.key, e.doc_count]);
          });

          series.update({data: seriesData});
        }
      });
    });
  };

  $scope.loadHistogram = function(){
    $scope.sections.forEach(function(section){
      $scope.loadHistorgramSection(section);
    });
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

  $scope.loadCampaigns = function(){
    ActionHero.action({
      from: 0,
      size: 20,
      sent: true,
    }, '/api/campaigns', 'GET', function(data){
      $scope.campaigns = data.campaigns;
      $scope.campaigns.forEach(function(campaign){
        $scope.loadCampaignStats(campaign);
      });
    });
  };

  $scope.loadCampaignStats = function(campaign){
    ActionHero.action({
      campaignId: campaign.id,
      interval: 'year',
      start: new Date(0).getTime(),
      end: new Date().getTime(),
    }, '/api/campaign/stats', 'GET', function(data){
      $scope.campaignFunnels[campaign.id] = data;
      $scope.campaignFunnels[campaign.id].rates = {
        sentAt: Math.round(data.totals.sentAt / data.totals.sentAt * 10000) / 100,
        readAt: Math.round(data.totals.readAt / data.totals.sentAt * 10000) / 100,
        actedAt: Math.round(data.totals.actedAt / data.totals.sentAt * 10000) / 100,
      };
    });
  };

  /*---- loader ----*/

  var loader = function(){
    console.log('.');
    clearTimeout($scope.timer);

    $scope.loadHistogram();
    $scope.loadStats();

    var sleepSeconds = (parseInt($scope.refreshInterval) * 1000);
    if(sleepSeconds > 0){
      $scope.timer = setTimeout(loader, sleepSeconds);
    }
  };

  $scope.$watch('refreshInterval', function(){ loader(); });

  // hadck to defer loading to next cycle
  setTimeout(function(){
    $('#realtimeChart').highcharts(chartData);
    loader();
  }, 10);

  $scope.$on('$locationChangeStart', function(){
    clearTimeout($scope.timer);
  });

  $scope.loadCampaigns();
  $scope.loadStatus();
}]);
