app.controller('people:recentBehavior', ['$scope', '$routeParams', 'ActionHero', 'User', function($scope, $routeParams, ActionHero, User){
  $scope.guid = $routeParams.guid;
  $scope.recentOptions = { from: 0, size: 1000, };
  $scope.records = [];
  $scope.user = User.getUser();

  $scope.loadRecent = function(){
    $scope.events = [];
    $scope.messages = [];

    var prepareData = function(){
      var sort = function(a, b){ return (a.createdAt > b.createdAt); };

      $scope.messages.sort(sort);
      $scope.events.sort(sort);

      // TODO: Group Better...
      var eventData = {};
      var messageData = {};
      var eventSeries = [];
      var messageSeries = [];
      var i;

      $scope.messages.forEach(function(message){
        var day = new Date(message.createdAt).toISOString().slice(0, 10);
        if(!messageData[day]){ messageData[day] = 0; }
        messageData[day]++;
      });

      $scope.events.forEach(function(event){
        var day = new Date(event.createdAt).toISOString().slice(0, 10);
        if(!eventData[day]){ eventData[day] = 0; }
        eventData[day]++;
      });

      Object.keys(messageData).forEach(function(k){
        var d = new Date(Date.parse(k));
        messageSeries.push({x: d, y: messageData[k]});
      });

      Object.keys(eventData).forEach(function(k){
        var d = new Date(Date.parse(k));
        eventSeries.push({x: d, y: eventData[k]});
      });

      var chartData = {
        title: {
          text: 'Recent Behavior',
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
        },
        yAxis: {
          title: { text: ('Recent Behavior' + ' Created') },
        },
        plotOptions: {
          line: {
            dataLabels: { enabled: true },
            enableMouseTracking: true
          }
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          floating: true,
        },
        series: [
          {name: 'Events',   data: eventSeries},
          {name: 'Messages', data: messageSeries},
        ]
      };

      // hadck to defer loading to next cycle
      setTimeout(function(){
        $('#histogramChart').highcharts(chartData);
      }, 10);
    };

    ActionHero.action({
      userId: $scope.user.id,
      searchKeys: 'personGuid',
      searchValues: $scope.guid,
      from: $scope.recentOptions.from,
      size: $scope.recentOptions.size,
    }, '/api/events/search', 'GET', function(data){
      $scope.events = data.events;
      prepareData();
    });

    ActionHero.action({
      userId: $scope.user.id,
      searchKeys: 'personGuid',
      searchValues: $scope.guid,
      from: $scope.recentOptions.from,
      size: $scope.recentOptions.size,
    }, '/api/messages/search', 'GET', function(data){
      $scope.messages = data.messages;
      prepareData();
    });
  };

  $scope.loadRecent();

}]);
