(function(){

  var module = angular.module('ActionHero', []);
  module.provider('ActionHero', ActionHeroService);

  /* ------------------- */

  function ActionHeroService(){
    this.$get = ['ngNotify', '$http', function(ngNotify, $http){
      var baseRoute = '';

      return {
        setBaseRoute: function(_baseRoute){
          baseRoute = _baseRoute;
        },

        action: function(data, path, verb, successCallback, errorCallback){
          var i;

          $('button').prop('disabled', true);

          if(typeof successCallback !== 'function'){
            successCallback = function(data){
              var successMessage = 'OK!';
              if(data.message){ successMessage = data.message; }
              ngNotify.set(successMessage, 'success');
            };
          }

          if(typeof errorCallback !== 'function'){
            errorCallback = function(errorMessage){ ngNotify.set(errorMessage, 'error'); };
          }

          for(i in data){
            if(data[i] === null || data[i] === undefined){ delete data[i]; }
          }

          if(Object.keys(data).length > 0 && (verb === 'get' || verb === 'GET') && path.indexOf('?') < 0){
            path += '?';
            for(i in data){ path += i + '=' + data[i] + '&'; }
          }

          $http({
            method  : verb,
            url     : baseRoute + path,
            data    : $.param(data),  // pass in data as strings
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
          }).success(function(data){
            $('button').prop('disabled', false);
            successCallback(data);
          }).catch(function(data){
            var errorMessage = '';
            if(data.data && data.data.error){
              errorMessage = data.data.error;
            }else{
              errorMessage = data.statusText + ' | ' + data.status;
            }
            errorCallback(errorMessage);

            setTimeout(function(){
              $('button').prop('disabled', false);
            }, 100);
          });
        }
      };
    }];
  };

}());
