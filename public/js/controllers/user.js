app.controller('user:create', ['$scope', '$rootScope', '$location', 'ActionHero', function($scope, $rootScope, $location, ActionHero){
  $scope.formData    = {};
  $scope.processForm = function(){
    ActionHero.action($scope.formData, '/api/user', 'POST', function(data){
      location.reload();
    });
  };
}]);

app.controller('users:list', ['$scope', '$rootScope', '$location', 'ngNotify', 'ActionHero', function($scope, $rootScope, $location, ngNotify, ActionHero){
  $scope.forms = {};
  $scope.forms.createUser = {};
  $scope.forms.editUser   = {};

  ActionHero.action({}, '/api/users/roles', 'GET', function(data){
    $scope.roles = data.roles;
  });

  $scope.loadUsers = function(){
    ActionHero.action({}, '/api/users', 'GET', function(data){
      $scope.users = data.users;
    });
  };

  $scope.createUser = function(){
    $scope.forms.createUser = {};
    $('#createUserModal').modal('show');
  };

  $scope.processCreateUserForm = function(){
    ActionHero.action($scope.forms.createUser, '/api/user', 'POST', function(data){
      $rootScope.clearModals('#createUserModal');
      $scope.forms.createUser = {};
      $scope.loadUsers();
      ngNotify.set('User Created', 'success');
    });
  };

  $scope.editUser = function(userId){
    $scope.forms.editUser = {};
    $('#editUserModal').modal('show');
    ActionHero.action({userId: userId}, '/api/user', 'GET', function(data){
      $scope.forms.editUser = data.user;
    });
  };

  $scope.processEditUserForm = function(){
    $scope.forms.editUser.userId = $scope.forms.editUser.id;
    ActionHero.action($scope.forms.editUser, '/api/user', 'PUT', function(data){
      $rootScope.clearModals('#editUserModal');
      $scope.forms.editUser = {};
      $scope.loadUsers();
      ngNotify.set('User Updated', 'success');
    });
  };

  $scope.deleteUser = function(userId){
    if(confirm('Are you sure?')){
      ActionHero.action({userId: userId}, '/api/user', 'DELETE', function(data){
        ngNotify.set('User Deleted', 'success');
        $scope.loadUsers();
      });
    }
  };

  $scope.loadUsers();
}]);

app.controller('user:edit', ['$scope', '$rootScope', '$location', 'ngNotify', 'ActionHero', function($scope, $rootScope, $location, ngNotify, ActionHero){

  ActionHero.action({}, '/api/users/roles', 'GET', function(data){
    $scope.roles = data.roles;
  });

  ActionHero.action({userId: $rootScope.user.id}, '/api/user', 'GET', function(data){
    $scope.formData = data.user;
  });

  $scope.processForm = function(){
    $scope.formData.userId = $rootScope.user.id;
    ActionHero.action($scope.formData, '/api/user', 'PUT', function(data){
      if(data.user){
        ngNotify.set('Account Updated', 'success');
        $rootScope.user = data.user;
        $scope.formData = data.user;
      }
    });
  };
}]);
