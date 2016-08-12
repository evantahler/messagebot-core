'use strict';

var MESSAGEBOT = MESSAGEBOT || {};

(function(){

  /* -- HELPERS -- */

  /* -- TRACKING -- */

  MESSAGEBOT.q = [];
  MESSAGEBOT.trackingDomain = '%%TRACKINGDOMAIN%%';
  MESSAGEBOT.apiRoute       = '%%APIROUTE%%';
  MESSAGEBOT.person = null;

  MESSAGEBOT.init = function(callback){
    if(!callback){ callback = MESSAGEBOT.loggerCallback; }

    if(!MESSAGEBOT.person){

    }else{

    }
  };

  MESSAGEBOT.track = function(data){
    MESSAGEBOT.q.push(data);
  };

  /* -- UTILS --*/

  MESSAGEBOT.loggerCallback = function(error){
    var message = '[MESSAGEBOT] ' + error;
    var func = console.log;
    if(conole.error){ func = console.error; }
    func(message);
  }

  MESSAGEBOT.action = function(route, method, params, callback){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
      var response;
      if(xmlhttp.readyState === 4) {
        if(xmlhttp.status === 200) {
          response = JSON.parse(xmlhttp.responseText);
        }else{
          try{
            response = JSON.parse(xmlhttp.responseText);
          }catch(e){
            response = { error: {statusText: xmlhttp.statusText, responseText: xmlhttp.responseText} };
          }
        }
        callback(response);
      }
    };

    var url = MESSAGEBOT.trackingDomain + '/' + MESSAGEBOT.apiRoute + '?';

    if(method === 'GET'){
      for (var param in params){
        url += param + '=' + params[param] + '&';
      }
    }

    xmlhttp.open(method, url, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(params));
  };

})();
