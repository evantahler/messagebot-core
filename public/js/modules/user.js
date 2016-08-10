(function(){

  var module = angular.module('User', []);
  module.provider('User', UserService);

  /* ------------------- */

  function UserService(){
    this.$get = [function(){
      var team = null;
      var user = null;

      return {
        setUser: function(_user){ user = _user; },
        setTeam: function(_team){ team = _team; },
        getUser: function(){ return user; },
        getTeam: function(){ return team; },
        clear:   function(){ team = null; user = null; },
      };

    }];
  };

})();
