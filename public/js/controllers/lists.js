app.controller('lists:list', ['$scope', '$location', 'ngNotify', '$routeParams', 'ActionHero', 'Utils', function($scope, $location, ngNotify, $routeParams, ActionHero, Utils){
  $scope.lists = [];
  $scope.forms = {};
  $scope.pagination = {};
  $scope.folder = {name: ($routeParams.folder || '_all')};
  $scope.forms.createList  = {};
  $scope.forms.editList   = {};

  var refreshTimer;
  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  var prettyPrintJSON = function(j){
    if(j && typeof j !== 'string'){
      return JSON.stringify(j, undefined, 4);
    }
  };

  $scope.loadLists = function(){
    var params = {
      from: (currentPage * perPage),
      size: perPage
    };
    if($scope.folder.name != '_all'){ params.folder = $scope.folder.name; }
    ActionHero.action(params, '/api/lists', 'GET', function(data){
      $scope.lists = data.lists;
      $scope.total = data.total;
      $scope.pagination = Utils.genratePagination(currentPage, perPage, $scope.total);

      if($scope.lists.length === 0 && currentPage !== 0){ $location.path('/lists/list/' + $scope.folder.name + '/0'); }
    });
  };

  $scope.loadFolders = function(){
    ActionHero.action({}, '/api/lists/folders', 'GET', function(data){
      $scope.folders = data.folders;
    });
  };

  $scope.createList = function(type){
    $scope.forms.createList = {type: type};
    $('#createListModal').modal('show');
  };

  $scope.processCreateListForm = function(){
    ActionHero.action($scope.forms.createList, '/api/list', 'POST', function(data){
      Utils.clearModals('#createListModal');
      ngNotify.set('List Created', 'success');
      $location.path('/list/' + data.list.id + '/people');
    });
  };

  $scope.editList = function(listId){
    $scope.forms.editList = {};
    $('#editListModal').modal('show');
    ActionHero.action({listId: listId}, '/api/list', 'GET', function(data){
      if(data.list.personQuery){  data.list.personQuery  = prettyPrintJSON(data.list.personQuery); }
      if(data.list.eventQuery){   data.list.eventQuery   = prettyPrintJSON(data.list.eventQuery); }
      if(data.list.messageQuery){ data.list.messageQuery = prettyPrintJSON(data.list.messageQuery); }
      $scope.forms.editList = data.list;
    });
  };

  $scope.processEditListForm = function(){
    $scope.forms.editList.listId = $scope.forms.editList.id;
    ActionHero.action($scope.forms.editList, '/api/list', 'PUT', function(data){
      Utils.clearModals('#editListModal');
      $scope.loadLists();
      $scope.loadFolders();
      ngNotify.set('List Updated', 'success');
    });
  };

  $scope.copyList = function(listId){
    var input = prompt("Please enter a name for the new list");
    if(input){
      ActionHero.action({
        listId: listId,
        name: input
      }, '/api/list/copy', 'POST', function(data){
        ngNotify.set('List Coppied', 'success');
        $location.path('/list/' + data.list.id + '/people');
      });
    }
  };

  $scope.peopleCount = function(listId){
    ActionHero.action({listId: listId}, '/api/list/people', 'POST', function(data){
      ngNotify.set('recount enqueued...', 'success');
    });
  };

  $scope.deleteList = function(listId){
    if(confirm('Are you sure?')){
      ActionHero.action({listId: listId}, '/api/list', 'DELETE', function(data){
        ngNotify.set('List Deleted', 'success');
        $scope.loadLists();
        $scope.loadFolders();
      });
    }
  };

  $scope.$watch('folder.name', function(){
    $location.path('/lists/list/' + $scope.folder.name + '/' + currentPage);
  });

  $scope.loadLists();
  $scope.loadFolders();
}]);

app.controller('lists:people:view', ['$scope', '$location', 'ngNotify', '$routeParams', 'FileUploader', 'ActionHero', 'Utils', function($scope, $location, ngNotify, $routeParams, FileUploader, ActionHero, Utils){
  $scope.list;
  $scope.forms = {
    addListPeopleViapersonGuids: {},
  };
  $scope.people = [];
  $scope.pagination = {};
  var currentPage = $routeParams.page || 0;
  var perPage = 50;

  $scope.uploader = new FileUploader({
    url: '/api/list/people',
    method: 'PUT',
    formData: [
      {listId: $routeParams.listId},
    ]
  });

  window.uploader = $scope.uploader

  $scope.uploader.onAfterAddingFile = function(item){
    item.removeAfterUpload = true;
    while($scope.uploader.queue.length > 1){ $scope.uploader.removeFromQueue(0); }
  };

  ActionHero.action({listId: $routeParams.listId}, '/api/list', 'GET', function(data){
    $scope.list = data.list;
  });

  $scope.loadPeople = function(){
    ActionHero.action({
      from: (currentPage * perPage),
      size: perPage,
      listId: $routeParams.listId,
    }, '/api/list/people', 'GET', function(data){
      $scope.people = data.people;
      $scope.total = data.total;
      $scope.pagination = Utils.genratePagination(currentPage, perPage, $scope.total);
    });
  };

  $scope.addListPeopleViapersonGuid = function(){
    $('#addListPeopleViapersonGuidModal').modal('show');
  };

  $scope.addListPeopleViaFile = function(){
    $('#addListPeopleViaFileModal').modal('show');
  };

  $scope.processAddListPeopleViapersonGuid = function(){
    $scope.forms.addListPeopleViapersonGuids.listId = $scope.list.id;
    ActionHero.action($scope.forms.addListPeopleViapersonGuids, '/api/list/people', 'PUT', function(data){
      Utils.clearModals('#addListPeopleViapersonGuidModal');
      $scope.loadPeople();
      $scope.forms.addListPeopleViapersonGuids = {};
      ngNotify.set('People Updated', 'success');
    });
  };

  $scope.processAddListPeopleViaFile = function(){
    $scope.uploader.uploadAll();
    var errored = false;

    $scope.uploader.onCompleteAll = function(){
      if(errored !== true){
        Utils.clearModals('#addListPeopleViaFileModal');
        $scope.loadPeople();
        ngNotify.set('People Updated', 'success');
      }
    };

    $scope.uploader.onErrorItem = function(item, response, status, headers){
      errored = true;
      ngNotify.set('error uploading ' + item.file.name + ' => ' + response.error, 'error');
    };
  };

  $scope.removeListPerson = function(personGuid){
    if(confirm('Are you sure?')){
      ActionHero.action({
        listId: $scope.list.id,
        personGuids: personGuid
      }, '/api/list/people', 'DELETE', function(data){
        ngNotify.set('Person removed from list', 'success');
        $scope.loadPeople();
      });
    }
  };

  $scope.loadPeople();
}]);
