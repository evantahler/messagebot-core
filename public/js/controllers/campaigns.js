app.controller('campaign:edit', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.campaign = {};
  $scope.types = ['simple', 'recurring', 'trigger'];
  $scope.lists = [];
  $scope.templates = [];
  $scope.transports = [];
  $scope.transport = {};
  $scope.list = {};
  $scope.template = {};

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

      $rootScope.action($scope, {listId: $scope.campaign.listId}, '/api/list', 'GET', function(data){
        $scope.list = data.list;
      });
      $rootScope.action($scope, {templateId: $scope.campaign.templateId}, '/api/template', 'GET', function(data){
        $scope.template = data.template;
      });

      $scope.loadTransports();
    });
  };

  $scope.editCampaign = function(){
    if($scope.campaign.sendAt){ $scope.campaign.sendAt = $scope.campaign.sendAt.getTime(); }
    if($scope.campaign.campaignVariables){ $scope.campaign.campaignVariables = JSON.stringify($scope.campaign.campaignVariables); }

    console.log($scope.campaign)
    $rootScope.action($scope, $scope.campaign, '/api/campaign', 'PUT', function(data){
      $scope.loadCampaign();
      ngNotify.set('Template Updated', 'success');
    });
  };

  $scope.deleteCampaign = function(){
    if(confirm('Are you sure?')){
      $rootScope.action($scope, $scope.campaign, '/api/campaign', 'DELETE', function(data){
        ngNotify.set('Campaign Deleted', 'success');
        $location.path('/campaigns/list');
      });
    }
  };

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
  $scope.pagination = {};
  $scope.forms.createCampaign = {};
  $scope.forms.editCampaign   = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.loadCampaigns = function(){
    $rootScope.action($scope, {
      from: (currentPage * perPage),
      size: perPage
    }, '/api/campaigns', 'GET', function(data){
      $scope.campaigns = data.campaigns;
      $scope.total = data.total;
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);
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
      });
    }
  };

  $scope.loadCampaigns();
  $scope.loadTemplates();
  $scope.loadLists();
  $scope.loadTransports();
}]);
