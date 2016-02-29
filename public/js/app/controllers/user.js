app.controller('user:create', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location){
  $scope.formData    = {};
  $scope.processForm = function(){
    $rootScope.authenticatedActionHelper($scope, $scope.formData, '/api/user', 'POST', function(data){
      location.reload();
    });
  };
}]);

app.controller('users:list', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){
  $scope.forms = {};
  $scope.forms.createUser = {};
  $scope.forms.editUser   = {};

  $rootScope.authenticatedActionHelper($scope, {}, '/api/user/statuses', 'GET', function(data){
    $scope.validStatuses = data.validStatuses;
  });

  $scope.loadUsers = function(){
    $rootScope.authenticatedActionHelper($scope, {}, '/api/users', 'GET', function(data){
      $scope.users = data.users;
    });
  };

  $scope.createUser = function(){
    $scope.forms.createUser = {};
    $('#createUserModal').modal('show');
  };

  $scope.processCreateUserForm = function(){
    $rootScope.authenticatedActionHelper($scope, $scope.forms.createUser, '/api/user', 'POST', function(data){
      $rootScope.clearModals('#createUserModal');
      $scope.forms.createUser = {};
      $scope.loadUsers();
      ngNotify.set('User Created', 'success');
    });
  };

  $scope.editUser = function(userId){
    $scope.forms.editUser = {};
    $('#editUserModal').modal('show');
    $rootScope.authenticatedActionHelper($scope, {userId: userId}, '/api/user', 'GET', function(data){
      $scope.forms.editUser = data.user;
    });
  };

  $scope.processEditUserForm = function(){
    $scope.forms.editUser.userId = $scope.forms.editUser.id;
    $rootScope.authenticatedActionHelper($scope, $scope.forms.editUser, '/api/user', 'PUT', function(data){
      $rootScope.clearModals('#editUserModal');
      $scope.forms.editUser = {};
      $scope.loadUsers();
      ngNotify.set('User Updated', 'success');
    });
  };

  $scope.deleteUser = function(userId){
    if(confirm('Are you sure?')){
      $rootScope.authenticatedActionHelper($scope, {userId: userId}, '/api/user', 'DELETE', function(data){
        ngNotify.set('User Deleted', 'success');
        $scope.loadUsers();
      });
    }
  };

  $scope.loadUsers();
}]);

app.controller('user:edit', ['$scope', '$rootScope', '$location', 'ngNotify', function($scope, $rootScope, $location, ngNotify){

  $rootScope.authenticatedActionHelper($scope, {}, '/api/user/statuses', 'GET', function(data){
    $scope.validStatuses = data.validStatuses;
  });

  $rootScope.authenticatedActionHelper($scope, {userId: $rootScope.user.id}, '/api/user', 'GET', function(data){
    $scope.formData = data.user;
  });

  $scope.processForm = function(){
    $scope.formData.userId = $rootScope.user.id;
    $rootScope.authenticatedActionHelper($scope, $scope.formData, '/api/user', 'PUT', function(data){
      if(data.user){
        ngNotify.set('Account Updated', 'success');
        $rootScope.user = data.user;
        $scope.formData = data.user;
      }
    });
  };
}]);
