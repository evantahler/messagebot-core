app.controller('campaign:stats', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.campaign = {};
  $scope.list = {};
  $scope.template = {};
  $scope.funnel = {};
  $scope.renderOptions = { personGuid: $rootScope.user.personGuid };

  $scope.histogramOptions = {
    interval: 'day',
    start: new Date(new Date().setYear( new Date().getFullYear() - 1 )),
    end: new Date(),
  };

  $scope.possibleIntervals = [ 'year', 'month', 'week', 'day', 'hour', 'minute' ];

  $scope.prepareRender = function(){
    $scope.template.url = '/api/template/render.html?' +
      'templateId=' + $scope.template.id +
      '&personGuid=' + $scope.renderOptions.personGuid +
      '&r=' + Math.floor(new Date().getTime() / 1000);
  };

  $scope.loadCampaign = function(){
    $rootScope.action($scope, {campaignId: $routeParams.campaignId}, '/api/campaign', 'GET', function(data){
      $scope.campaign = data.campaign;
      $scope.campaign.campaignId = data.campaign.id;

      if($scope.campaign.sendAt){ $scope.campaign.sendAt = new Date($scope.campaign.sendAt); }
      if($scope.campaign.sentAt){ $scope.campaign.sentAt = new Date($scope.campaign.sentAt); }

      $rootScope.action($scope, {listId: $scope.campaign.listId}, '/api/list', 'GET', function(data){
        $scope.list = data.list;
      });
      $rootScope.action($scope, {templateId: $scope.campaign.templateId}, '/api/template', 'GET', function(data){
        $scope.template = data.template;
        $scope.prepareRender();
      });
    });
  };

  $scope.loadCampaignStats = function(){
    $rootScope.action($scope, {
      campaignId: $routeParams.campaignId,
      interval: $scope.histogramOptions.interval,
      start: $scope.histogramOptions.start.getTime(),
      end: $scope.histogramOptions.end.getTime(),
    }, '/api/campaign/stats', 'GET', function(data){
      $scope.funnel = data;
      $scope.funnel.rates = {
        sentAt: Math.round($scope.funnel.totals.sentAt / $scope.funnel.totals.sentAt * 10000) / 100,
        readAt: Math.round($scope.funnel.totals.readAt / $scope.funnel.totals.sentAt * 10000) / 100,
        actedAt: Math.round($scope.funnel.totals.actedAt / $scope.funnel.totals.sentAt * 10000) / 100,
      }

      var sentAtSeries  = [];
      var readAtSeries  = [];
      var actedAtSeries = [];

      $scope.funnel.sentAt.forEach(function(e){
        sentAtSeries.push({x: new Date(e.key), y: e.doc_count});
      });
      $scope.funnel.readAt.forEach(function(e){
        readAtSeries.push({x: new Date(e.key), y: e.doc_count});
      });
      $scope.funnel.actedAt.forEach(function(e){
        actedAtSeries.push({x: new Date(e.key), y: e.doc_count});
      });

      var chartData = {
        chart: {
          type: 'spline',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        title: {
          text: $scope.campaign.name,
          align: 'left',
        },
        xAxis: {
          type: 'datetime',
          tickPixelInterval: 150
        },
        yAxis: {
          title: { text: 'count' },
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          floating: true,
        },
        series: [
          {name: 'sent messages', data: sentAtSeries, color: 'orange'},
          {name: 'read messages', data: readAtSeries, color: 'blue'},
          {name: 'acted messages', data: actedAtSeries, color: 'green'},
        ]
      };

      // hadck to defer loading to next cycle
      setTimeout(function(){
        $('#histogramChart').highcharts(chartData);
      }, 10);
    });
  };

  $scope.$watch('renderOptions.personGuid', function(){
    $scope.prepareRender();
  });

  $scope.loadCampaign();
  $scope.loadCampaignStats();
}]);

app.controller('campaign:edit', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.campaign = {};
  $scope.types = ['simple', 'recurring', 'trigger'];
  $scope.lists = [];
  $scope.templates = [];
  $scope.transports = [];
  $scope.transport = {};
  $scope.list = {};
  $scope.template = {};
  $scope.renderOptions = { personGuid: $rootScope.user.personGuid };

  $scope.prepareRender = function(){
    $scope.template.url = '/api/template/render.html?' +
      'templateId=' + $scope.template.id +
      '&personGuid=' + $scope.renderOptions.personGuid +
      '&r=' + Math.floor(new Date().getTime() / 1000);
  };

  $scope.loadTransports = function(){
    $rootScope.action($scope, {}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;

      Object.keys(data.transports).forEach(function(t){
        var transport = data.transports[t];
        if(transport.name === $scope.campaign.transport){ $scope.transport = transport; }
      });
    });
  };

  $scope.loadLists = function(){
    //TODO: Pagination
    $rootScope.action($scope, {}, '/api/lists', 'GET', function(data){
      $scope.lists = data.lists;
    });
  };

  $scope.loadTemplates = function(){
    //TODO: Pagination
    $rootScope.action($scope, {}, '/api/templates', 'GET', function(data){
      $scope.templates = data.templates;
    });
  };

  $scope.loadCampaign = function(){
    $rootScope.action($scope, {campaignId: $routeParams.campaignId}, '/api/campaign', 'GET', function(data){
      $scope.campaign = data.campaign;
      $scope.campaign.campaignId = data.campaign.id;

      if($scope.campaign.sendAt){ $scope.campaign.sendAt = new Date($scope.campaign.sendAt); }
      if($scope.campaign.sentAt){ $scope.campaign.sentAt = new Date($scope.campaign.sentAt); }

      $rootScope.action($scope, {listId: $scope.campaign.listId}, '/api/list', 'GET', function(data){
        $scope.list = data.list;
      });
      $rootScope.action($scope, {templateId: $scope.campaign.templateId}, '/api/template', 'GET', function(data){
        $scope.template = data.template;
        $scope.prepareRender();
      });

      $scope.loadTransports();
    });
  };

  $scope.editCampaign = function(){
    if($scope.campaign.sendAt){ $scope.campaign.sendAt = $scope.campaign.sendAt.getTime(); }
    if($scope.campaign.campaignVariables){ $scope.campaign.campaignVariables = JSON.stringify($scope.campaign.campaignVariables); }

    $rootScope.action($scope, $scope.campaign, '/api/campaign', 'PUT', function(data){
      $scope.loadCampaign();
      ngNotify.set('Campaign Updated', 'success');
    });
  };

  $scope.deleteCampaign = function(){
    if(confirm('Are you sure?')){
      // $rootScope.action($scope, $scope.campaign, '/api/campaign', 'DELETE', function(data){
      //   ngNotify.set('Campaign Deleted', 'success');
      //   $location.path('/campaigns/list');
      // });
    }
  };

  $scope.$watch('renderOptions.personGuid', function(){
    $scope.prepareRender();
  });

  $scope.loadCampaign();
  $scope.loadTemplates();
  $scope.loadLists();
}]);

app.controller('campaigns:list', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.campaigns = [];
  $scope.lists = [];
  $scope.templates = [];
  $scope.transports = [];
  $scope.types = ['simple', 'recurring', 'trigger'];
  $scope.forms = {};
  $scope.folder = {name: ($routeParams.folder || '_all')};
  $scope.pagination = {};
  $scope.forms.createCampaign = {};
  $scope.forms.editCampaign   = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.loadCampaigns = function(){
    var params =  {
      from: (currentPage * perPage),
      size: perPage,
    };
    if($scope.folder.name != '_all'){ params.folder = $scope.folder.name; }
    $rootScope.action($scope, params, '/api/campaigns', 'GET', function(data){
      $scope.campaigns = data.campaigns;
      $scope.total = data.total;
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);

      if($scope.campaigns.length === 0 && currentPage !== 0){ $location.path('/campaigns/list/' + $scope.folder.name + '/0'); }
    });
  };

  $scope.loadTransports = function(){
    //TODO: Pagination
    $rootScope.action($scope, {}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;
    });
  };

  $scope.loadLists = function(){
    //TODO: Pagination
    $rootScope.action($scope, {}, '/api/lists', 'GET', function(data){
      $scope.lists = data.lists;
    });
  };

  $scope.loadFolders = function(){
    $rootScope.action($scope, {}, '/api/campaigns/folders', 'GET', function(data){
      $scope.folders = data.folders;
    });
  };


  $scope.loadTemplates = function(){
    //TODO: Pagination
    $rootScope.action($scope, {}, '/api/templates', 'GET', function(data){
      $scope.templates = data.templates;
    });
  };

  $scope.createCampaign= function(){
    $('#createCampaignModal').modal('show');
  };

  $scope.processCreateCampaignForm = function(){
    $rootScope.action($scope, $scope.forms.createCampaign, '/api/campaign', 'POST', function(data){
      $rootScope.clearModals('#createCampaignModal');
      ngNotify.set('Campaign Created', 'success');
      $location.path('/campaign/' + data.campaign.id);
    });
  };

  $scope.editCampaign = function(campaignId){
    $scope.forms.editCampaign = {};
    $('#editCampaignModal').modal('show');
    $rootScope.action($scope, {campaignId: campaignId}, '/api/campaign', 'GET', function(data){
      $scope.forms.editCampaign = data.campaign;
    });
  };

  $scope.processEditCampaignForm = function(){
    $scope.forms.editCampaign.campaignId = $scope.forms.editCampaign.id;
    $rootScope.action($scope, $scope.forms.editCampaign, '/api/campaign', 'PUT', function(data){
      $rootScope.clearModals('#editCampaignModal');
      $scope.loadCampaigns();
      $scope.loadFolders();
      ngNotify.set('Campaign Updated', 'success');
    });
  };

  $scope.copyCampaign = function(campaignId){
    var input = prompt("Please enter a name for the new campaign");
    if(input){
      $rootScope.action($scope, {
        campaignId: campaignId,
        name: input
      }, '/api/campaign/copy', 'POST', function(data){
        ngNotify.set('Campaign Coppied', 'success');
        $location.path('/campaign/' + data.campaign.id);
      });
    }
  };

  $scope.deleteCampaign = function(campaignId){
    if(confirm('Are you sure?')){
      $rootScope.action($scope, {campaignId: campaignId}, '/api/campaign', 'DELETE', function(data){
        ngNotify.set('Campaign Deleted', 'success');
        $scope.loadCampaigns();
        $scope.loadFolders();
      });
    }
  };

  $scope.$watch('folder.name', function(){
    $location.path('/campaigns/list/' + $scope.folder.name + '/' + currentPage);
  });

  $scope.loadCampaigns();
  $scope.loadTemplates();
  $scope.loadLists();
  $scope.loadFolders();
  $scope.loadTransports();
}]);
