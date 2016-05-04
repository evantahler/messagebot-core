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
    $rootScope.authenticatedActionHelper($scope, {
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
    $rootScope.authenticatedActionHelper($scope, {}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;
    });
  };

  $scope.loadLists = function(){
    //TODO: Pagination
    $rootScope.authenticatedActionHelper($scope, {}, '/api/lists', 'GET', function(data){
      $scope.lists = data.lists;
    });
  };

  $scope.loadTemplates = function(){
    //TODO: Pagination
    $rootScope.authenticatedActionHelper($scope, {}, '/api/templates', 'GET', function(data){
      $scope.templates = data.templates;
    });
  };

  $scope.createCampaign= function(){
    $('#createCampaignModal').modal('show');
  };

  $scope.processCreateCampaignForm = function(){
    $rootScope.authenticatedActionHelper($scope, $scope.forms.createCampaign, '/api/campaign', 'POST', function(data){
      $rootScope.clearModals('#createCampaignModal');
      $scope.loadCampaigns();
      ngNotify.set('Campaign Created', 'success');
    });
  };

  $scope.editCampaign = function(campaignId){
    $scope.forms.editCampaign = {};
    $('#editCampaignModal').modal('show');
    $rootScope.authenticatedActionHelper($scope, {campaignId: campaignId}, '/api/campaign', 'GET', function(data){
      $scope.forms.editCampaign = data.campaign;
    });
  };

  $scope.processEditCampaignForm = function(){
    $scope.forms.editCampaign.campaignId = $scope.forms.editCampaign.id;
    $rootScope.authenticatedActionHelper($scope, $scope.forms.editCampaign, '/api/campaign', 'PUT', function(data){
      $rootScope.clearModals('#editCampaignModal');
      $scope.loadCampaigns();
      ngNotify.set('Campaign Updated', 'success');
    });
  };

  $scope.copyCampaign = function(campaignId){
    var input = prompt("Please enter a name for the new campaign");
    if(input){
      $rootScope.authenticatedActionHelper($scope, {
        campaignId: campaignId,
        name: input
      }, '/api/campaign/copy', 'POST', function(data){
        $scope.loadCampaigns();
        ngNotify.set('Campaign Coppied', 'success');
      });
    }
  };

  $scope.deleteCampaign = function(campaignId){
    if(confirm('Are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {campaignId: campaignId}, '/api/campaign', 'DELETE', function(data){
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
