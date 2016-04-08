app.controller('lists:list', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  $scope.lists = [];
  $scope.forms = {};
  $scope.forms.createList = {};
  $scope.forms.editlist   = {};
  var refreshTimer;

  var prettyPrintJSON = function(j){
    if(j && typeof j !== 'string'){
      return JSON.stringify(j, undefined, 4);
    }
  };

  $scope.loadLists = function(){
    $rootScope.authenticatedActionHelper($scope, {}, '/api/lists', 'GET', function(data){
      $scope.lists = data.lists;
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
    $rootScope.authenticatedActionHelper($scope, {listId: listId}, '/api/list/peopleCount', 'POST', function(data){
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
  setInterval($scope.loadLists, (1000 * 10));
}]);
