app.controller('template:edit', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.template = {};
  $scope.options = {
    userGuid: 'XXX',
  };

  var lastSave = new Date().getTime() - 1000;

  $scope.aceLoaded = function(_editor){
    // This is to remove following warning message on console:
    // Automatically scrolling cursor into view after selection change this will be disabled in the next version
    // set editor.$blockScrolling = Infinity to disable this message
    _editor.$blockScrolling = Infinity;
  };

  $scope.prepareRender = function(){
    $scope.template.url = '/api/template/render.html?' +
      'templateId=' + $scope.template.id +
      '&userGuid=' + $scope.options.userGuid +
      '&csrfToken=' + $rootScope.csrfToken +
      '&r=' + Math.floor(new Date().getTime() / 1000);
  };

  $scope.loadTemplate = function(){
    $rootScope.authenticatedActionHelper($scope, {templateId: $routeParams.templateId}, '/api/template', 'GET', function(data){
      $scope.template = data.template;
      $scope.template.templateId = $scope.template.id;
      $scope.prepareRender();
    });
  };

  $scope.editTemplate = function(){
    $rootScope.authenticatedActionHelper($scope, $scope.template, '/api/template', 'PUT', function(data){
      $scope.template = data.template;
      $scope.template.templateId = $scope.template.id;
      $scope.prepareRender();
      ngNotify.set('Template Updated', 'success');
    });
  };

  $scope.deleteTemplate = function(){
    if(confirm('Are you sure?')){
      $rootScope.authenticatedActionHelper($scope, $scope.template, '/api/template', 'DELETE', function(data){
        ngNotify.set('Template Deleted', 'success');
        $location.path('/templates/list');
      });
    }
  };

  $scope.loadTemplate();

  $scope.$watch('options.userGuid', function(){ $scope.prepareRender(); });
  $scope.$watch('template.template', function(){
    var now = new Date().getTime();
    if(now > lastSave + (1000 * 10)){
      lastSave = now;
      $scope.editTemplate();
    }
  });
}]);


app.controller('templates:list', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.lists = [];
  $scope.transports = [];
  $scope.forms = {};
  $scope.pagination = {};
  $scope.forms.createTemplate = {};
  $scope.forms.editTemplate   = {};

  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  var prettyPrintJSON = function(j){
    if(j && typeof j !== 'string'){
      return JSON.stringify(j, undefined, 4);
    }
  };

  $scope.loadTemplates = function(){
    $rootScope.authenticatedActionHelper($scope, {
      from: (currentPage * perPage),
      size: perPage
    }, '/api/templates', 'GET', function(data){
      $scope.templates = data.templates;
      $scope.total = data.total;
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);
    });
  };

  $scope.loadTransports = function(){
    $rootScope.authenticatedActionHelper($scope, {}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;
    });
  };

  $scope.createTemplate = function(){
    $('#createTemplateModal').modal('show');
  };

  $scope.processCreateTemplateForm = function(){
    $rootScope.authenticatedActionHelper($scope, $scope.forms.createTemplate, '/api/template', 'POST', function(data){
      $rootScope.clearModals('#createTemplateModal');
      $scope.loadTemplates();
      ngNotify.set('Template Created', 'success');
    });
  };

  $scope.editTemplate = function(templateId){
    $scope.forms.editTemplate = {};
    $('#editTemplateModal').modal('show');
    $rootScope.authenticatedActionHelper($scope, {templateId: templateId}, '/api/template', 'GET', function(data){
      $scope.forms.editTemplate = data.template;
    });
  };

  $scope.processEditTemplateForm = function(){
    $scope.forms.editTemplate.templateId = $scope.forms.editTemplate.id;
    $rootScope.authenticatedActionHelper($scope, $scope.forms.editTemplate, '/api/template', 'PUT', function(data){
      $rootScope.clearModals('#editTemplateModal');
      $scope.loadTemplates();
      ngNotify.set('Template Updated', 'success');
    });
  };

  $scope.copyTemplate = function(templateId){
    var input = prompt("Please enter a name for the new template");
    if(input){
      $rootScope.authenticatedActionHelper($scope, {
        templateId: templateId,
        name: input
      }, '/api/template/copy', 'POST', function(data){
        $scope.loadTemplates();
        ngNotify.set('Template Coppied', 'success');
      });
    }
  };

  $scope.deleteTemplate = function(templateId){
    if(confirm('Are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {templateId: templateId}, '/api/template', 'DELETE', function(data){
        ngNotify.set('Tepmplate Deleted', 'success');
        $scope.loadTemplates();
      });
    }
  };

  $scope.loadTemplates();
  $scope.loadTransports();
}]);
