app.controller('lists:list', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.lists = [];
  $scope.forms = {};
  $scope.pagination = {};
  $scope.forms.createList = {};
  $scope.forms.editlist   = {};

  var refreshTimer;
  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  var prettyPrintJSON = function(j){
    if(j && typeof j !== 'string'){
      return JSON.stringify(j, undefined, 4);
    }
  };

  $scope.loadLists = function(){
    $rootScope.authenticatedActionHelper($scope, {
      from: (currentPage * perPage),
      size: perPage
    }, '/api/lists', 'GET', function(data){
      $scope.lists = data.lists;
      $scope.total = data.total;
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);
    });
  };

  $scope.createList = function(){
    $scope.forms.createList = {};
    $('#createListModal').modal('show');
  };

  $scope.processCreateListForm = function(){
    $rootScope.authenticatedActionHelper($scope, $scope.forms.createList, '/api/list', 'POST', function(data){
      $rootScope.clearModals('#createListModal');
      $scope.forms.createList = {};
      $scope.loadLists();
      ngNotify.set('List Created', 'success');
    });
  };

  $scope.editList = function(listId){
    $scope.forms.editList = {};
    $('#editListModal').modal('show');
    $rootScope.authenticatedActionHelper($scope, {listId: listId}, '/api/list', 'GET', function(data){
      data.list.personQuery  = prettyPrintJSON(data.list.personQuery);
      data.list.eventQuery   = prettyPrintJSON(data.list.eventQuery);
      data.list.messageQuery = prettyPrintJSON(data.list.messageQuery);
      $scope.forms.editList = data.list;
    });
  };

  $scope.processEditListForm = function(){
    $scope.forms.editList.listId = $scope.forms.editList.id;
    $rootScope.authenticatedActionHelper($scope, $scope.forms.editList, '/api/list', 'PUT', function(data){
      $rootScope.clearModals('#editListModal');
      $scope.forms.editList = {};
      $scope.loadLists();
      ngNotify.set('List Updated', 'success');
    });
  };

  $scope.peopleCount = function(listId){
    $rootScope.authenticatedActionHelper($scope, {listId: listId}, '/api/list/people', 'POST', function(data){
      ngNotify.set('recount enqueued...', 'success');
    });
  };

  $scope.deleteList = function(listId){
    if(confirm('Are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {listId: listId}, '/api/list', 'DELETE', function(data){
        ngNotify.set('List Deleted', 'success');
        $scope.loadLists();
      });
    }
  };

  $scope.$on("$destroy", function(event){
    clearTimeout(refreshTimer);
  });

  $scope.loadLists();
  refreshTimer = setInterval($scope.loadLists, (1000 * 10));
}]);

app.controller('lists:people:view', ['$scope', '$rootScope', '$location', 'ngNotify', '$routeParams', function($scope, $rootScope, $location, ngNotify, $routeParams){
  $scope.list;
  $scope.people = [];
  $scope.pagination = {};
  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $rootScope.authenticatedActionHelper($scope, {listId: $routeParams.listId}, '/api/list', 'GET', function(data){
    $scope.list = data.list;
  });

  $scope.loadPeople = function(){
    $rootScope.authenticatedActionHelper($scope, {
      from: (currentPage * perPage),
      size: perPage,
      listId: $routeParams.listId,
    }, '/api/list/people', 'GET', function(data){
      $scope.people = data.people;
      $scope.total = data.total;
      $scope.pagination = $rootScope.genratePagination(currentPage, perPage, $scope.total);
    });
  };

  $scope.loadPeople();
}]);
