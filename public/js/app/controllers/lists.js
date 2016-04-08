app.controller('lists:list', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  $scope.lists = [];
  $scope.forms = {};
  $scope.forms.createList = {};
  $scope.forms.editlist   = {};

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

  $scope.deleteList = function(listId){
    if(confirm('Are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {listId: listId}, '/api/list', 'DELETE', function(data){
        ngNotify.set('List Deleted', 'success');
        $scope.loadLists();
      });
    }
  };

  $scope.loadLists();
}]);
