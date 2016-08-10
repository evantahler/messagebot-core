app.controller('record:new', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', 'ActionHero', function($scope, $rootScope, $location, ngNotify, $routeParams, ActionHero){
  $scope.section = $rootScope.section;                     // people
  $scope.recordType = $rootScope.singular($scope.section); // person
  $scope.formData = {
    createdAt: new Date(),
    sync: true,
    data: {},
  };

  $scope.newDataKey;
  $scope.newDataValue;

  $('#newDataKey').keydown(function(e){
    if(e.keyCode === 13){
      e.preventDefault();
      return $scope.loadDataProperty();
    }
  });

  $('#newDataValue').keydown(function(e){
    if(e.keyCode === 13){
      e.preventDefault();
      return $scope.loadDataProperty();
    }
  });

  $scope.loadDocumenation = function(){
    ActionHero.action({
      userId: $rootScope.user.id,
      guid: $scope.guid
    }, '/api/system/documentation', 'GET', function(data){
      $scope.action = data.documentation[$scope.recordType + ':create'][1];
    });
  };

  $scope.loadDataProperty = function(){
    if(!$scope.newDataKey || !$scope.newDataValue){ return false; }
    $scope.formData.data[$scope.newDataKey] = $scope.newDataValue;
    $scope.newDataKey = null;
    $scope.newDataValue = null;

    return false; // to prevent forms from submitting
  };

  $scope.deleteDataAttribute = function(k){
    delete $scope.formData.data[k];
  };

  $scope.processForm = function(event){
    var payload = {};
    for(var i in $scope.formData){
      payload[i] = $scope.formData[i];
    };

    payload.createdAt = payload.createdAt.getTime();
    payload.teamId    = $rootScope.user.teamId;

    ActionHero.action(payload, '/api/' + $scope.recordType, 'POST', function(data){
      $location.path('/' + $scope.recordType + '/' + data.guid);
    });
  };

  $scope.loadDocumenation();
}]);

app.controller('record:view', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', 'ActionHero', function($scope, $rootScope, $location, ngNotify, $routeParams, ActionHero){
  $scope.section = $rootScope.section;                     // people
  $scope.recordType = $rootScope.singular($scope.section); // person

  $scope.guid = $routeParams.guid;
  $scope.newAttribute = {};

  $scope.renderableData = [
    'data',
    'personGuid',
    'eventGuid',
    'messageGuid',
    'location',
    'body',
    'campaignId'
  ];

  $scope.load = function(){
    $scope.formData = {};
    ActionHero.action({
      userId: $rootScope.user.id,
      guid: $scope.guid
    }, '/api/' + $scope.recordType, 'GET', function(data){
      $scope.record = data[$scope.recordType];
      if(data.lists){ $scope.lists = data.lists; }

      if($scope.record.body){
        setTimeout(function(){
          var iframe = $('#bodyIframe')[0];
          iframe.contentWindow.document.open();
          iframe.contentWindow.document.write($scope.record.body);
          iframe.contentWindow.document.close();
        }, 1000);
      }

      if($scope.record.location){
        $scope.map ={
          center: {
            lat: $scope.record.location.lat,
            lng: $scope.record.location.lon,
            zoom: 8
          },
          markers: {
            point: {
              lat: $scope.record.location.lat,
              lng: $scope.record.location.lon,
              message: 'lat: ' + $scope.record.location.lat + '<br> lng: ' + $scope.record.location.lon,
            }
          }
        };
      }
    });
  };

  $scope.updateAttribute = function(key, value){
    if(!value){ value = $scope.record.data[key]; }

    var data = {};
    data[key] = value;
    ActionHero.action({
      userId: $rootScope.user.id,
      guid: $scope.guid,
      data: JSON.stringify(data),
    }, '/api/' + $scope.recordType, 'PUT', function(data){
      $scope.formData = {};
      $scope.record = data[$scope.recordType];
    });
  };

  $scope.deleteAttribute = function(key){
    var data = {};
    data[key] = '_delete';
    ActionHero.action({
      userId: $rootScope.user.id,
      guid: $scope.guid,
      data: JSON.stringify(data),
    }, '/api/' + $scope.recordType, 'PUT', function(data){
      $scope.record = data[$scope.recordType];
    });
  };

  $scope.addAttribute = function(key, value){
    $scope.updateAttribute($scope.newAttribute.key, $scope.newAttribute.value);
    $scope.newAttribute = {};
  };

  $scope.deleteRecord = function(){
    if(confirm('are you sure?')){
      ActionHero.action({
        userId: $rootScope.user.id,
        guid: $scope.guid,
      }, '/api/' + $scope.recordType, 'DELETE', function(data){
        $location.path('/' + $scope.section + '/recent');
      });
    }
  };

  $scope.load();

}]);
