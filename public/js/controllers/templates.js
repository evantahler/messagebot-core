app.controller('template:edit', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.template = {};
  $scope.renderOptions = {
    personGuid: $rootScope.user.personGuid,
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
      '&personGuid=' + $scope.renderOptions.personGuid +
      '&r=' + Math.floor(new Date().getTime() / 1000);
  };

  $scope.loadTemplate = function(){
    $rootScope.action($scope, {templateId: $routeParams.templateId}, '/api/template', 'GET', function(data){
      $scope.template = data.template;
      $scope.template.templateId = $scope.template.id;
      $scope.prepareRender();
    });
  };

  $scope.loadView = function(){
    $rootScope.action($scope, {
      templateId: $routeParams.templateId,
      personGuid: $scope.renderOptions.personGuid,
    }, '/api/template/render', 'GET', function(data){
      $scope.view = data.view;
    });
  };

  $scope.editTemplate = function(){
    $rootScope.action($scope, $scope.template, '/api/template', 'PUT', function(data){
      $scope.template = data.template;
      $scope.template.templateId = $scope.template.id;
      $scope.prepareRender();
      ngNotify.set('Template Updated', 'success');
    });
  };

  $scope.deleteTemplate = function(){
    if(confirm('Are you sure?')){
      $rootScope.action($scope, $scope.template, '/api/template', 'DELETE', function(data){
        ngNotify.set('Template Deleted', 'success');
        $location.path('/templates/list');
      });
    }
  };

  $scope.loadTemplate();
  $scope.loadView();

  $scope.$watch('renderOptions.personGuid', function(){
    $scope.prepareRender();
    $scope.loadView();
  });

  // TODO: we need a toggle for autosaving
  // as it might be dangerous for an active campaign

  // $scope.$watch('template.template', function(){
  //   var now = new Date().getTime();
  //   if(now > lastSave + (1000 * 10)){
  //     lastSave = now;
  //     $scope.editTemplate();
  //   }
  // });
}]);


app.controller('templates:list', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.lists = [];
  $scope.transports = [];
  $scope.forms = {};
  $scope.folder = {name: ($routeParams.folder || '_all')};
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
    var params = {
      from: (currentPage * perPage),
      size: perPage
    };
    if($scope.folder.name != '_all'){ params.folder = $scope.folder.name; }
    $rootScope.action($scope, params, '/api/templates', 'GET', function(data){
      $scope.templates = data.templates;
      $scope.total = data.total;
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);

      if($scope.templates.length === 0 && currentPage !== 0){ $location.path('/templates/list/' + $scope.folder.name + '/0'); }
    });
  };

  $scope.loadFolders = function(){
    $rootScope.action($scope, {}, '/api/templates/folders', 'GET', function(data){
      $scope.folders = data.folders;
    });
  };

  $scope.loadTransports = function(){
    $rootScope.action($scope, {}, '/api/transports', 'GET', function(data){
      $scope.transports = data.transports;
    });
  };

  $scope.createTemplate = function(){
    $('#createTemplateModal').modal('show');
  };

  $scope.processCreateTemplateForm = function(){
    $rootScope.action($scope, $scope.forms.createTemplate, '/api/template', 'POST', function(data){
      $rootScope.clearModals('#createTemplateModal');
      ngNotify.set('Template Created', 'success');
      $location.path('/template/' + data.template.id);
    });
  };

  $scope.editTemplate = function(templateId){
    $scope.forms.editTemplate = {};
    $('#editTemplateModal').modal('show');
    $rootScope.action($scope, {templateId: templateId}, '/api/template', 'GET', function(data){
      $scope.forms.editTemplate = data.template;
    });
  };

  $scope.processEditTemplateForm = function(){
    $scope.forms.editTemplate.templateId = $scope.forms.editTemplate.id;
    $rootScope.action($scope, $scope.forms.editTemplate, '/api/template', 'PUT', function(data){
      $rootScope.clearModals('#editTemplateModal');
      $scope.loadTemplates();
      $scope.loadFolders();
      ngNotify.set('Template Updated', 'success');
    });
  };

  $scope.copyTemplate = function(templateId){
    var input = prompt("Please enter a name for the new template");
    if(input){
      $rootScope.action($scope, {
        templateId: templateId,
        name: input
      }, '/api/template/copy', 'POST', function(data){
        ngNotify.set('Template Coppied', 'success');
        $location.path('/template/' + data.template.id);
      });
    }
  };

  $scope.deleteTemplate = function(templateId){
    if(confirm('Are you sure?')){
      $rootScope.action($scope, {templateId: templateId}, '/api/template', 'DELETE', function(data){
        ngNotify.set('Tepmplate Deleted', 'success');
        $scope.loadTemplates();
        $scope.loadFolders();
      });
    }
  };

  $scope.$watch('folder.name', function(){
    $location.path('/templates/list/' + $scope.folder.name + '/' + currentPage);
  });

  $scope.loadTemplates();
  $scope.loadFolders();
  $scope.loadTransports();
}]);
