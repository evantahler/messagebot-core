'use strict';

var MESSAGEBOT = MESSAGEBOT || {};

(function(){

  /* -- UTILS --*/

  MESSAGEBOT.getTrackingParams = function(){
    var params = {
      device: 'web',
      source: 'web',
      data: {},
    };

    params.data.userAgent  = window.navigator.userAgent;
    params.data.doNotTrack = window.navigator.doNotTrack;
    params.data.language   = window.navigator.language;
    params.data.languages  = window.navigator.languages;
    params.data.platform   = window.navigator.platform;
    params.data.hash       = window.location.hash;
    params.data.host       = window.location.host;
    params.data.hostname   = window.location.hostname;
    params.data.href       = window.location.href;
    params.data.origin     = window.location.origin;
    params.data.pathname   = window.location.pathname;
    params.data.port       = window.location.port;
    params.data.protocol   = window.location.protocol;
    params.data.referrer   = window.document.referrer;

    if(window.screen){
      params.data.resolution = window.screen.width + 'x' + window.screen.height;
    }

    // http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    // Opera 8.0+
    var isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera || window.navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    // At least Safari 3+: "[object HTMLElementConstructor]"
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!window.document.documentMode;
    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    if(isOpera){   params.device += ':opera';            }
    if(isFirefox){ params.device += ':firefox';          }
    if(isSafari){  params.device += ':safari';           }
    if(isIE){      params.device += ':internetExplorer'; }
    if(isEdge){    params.device += ':edge';             }
    if(isChrome){  params.device += ':chrome';           }

    return params;
  };

  MESSAGEBOT.loggerCallback = function(error){
    if(error){
      var message = '[MESSAGEBOT] ' + error;
      console.log(message);
    }
  };

  MESSAGEBOT.action = function(route, method, params, callback){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
      var response;
      if(xmlhttp.readyState === 4){
        if(xmlhttp.status === 200){
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

    var url = MESSAGEBOT.trackingDomain + '/' + MESSAGEBOT.apiRoute;
    if(route[0] !== '/'){ url += '/'; }
    url += route + '?';

    if(method === 'GET'){
      for(var param in params){ url += param + '=' + params[param] + '&'; }
    }

    xmlhttp.open(method, url, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(params));
  };

  MESSAGEBOT.getURLParameter = function(name){
    try{
      return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }catch(e){
      console.log(e);
      return null;
    }
  };

  MESSAGEBOT.cookies = {
    create: function(name, value){
      var expires = '';
      if(MESSAGEBOT.cookieExpiry){
        var date = new Date();
        date.setTime(date.getTime() + MESSAGEBOT.cookieExpiry);
        expires = '; expires=' + date.toGMTString();
      }
      window.document.cookie = name + '=' + value + expires + '; path=/';
    },

    read: function(name){
      var nameEQ = name + '=';
      var ca = window.document.cookie.split(';');
      for(var i = 0; i < ca.length; i++){
        var c = ca[i];
        while(c.charAt(0) === ' '){ c = c.substring(1, c.length); }
        if(c.indexOf(nameEQ) === 0){ return c.substring(nameEQ.length, c.length); }
      }
      return null;
    },

    delete: function(name){
      MESSAGEBOT.cookies.create(name, '', -1);
    }
  };

  /* -- TRACKING -- */

  MESSAGEBOT.trackingDomain     = '%%TRACKINGDOMAIN%%';
  MESSAGEBOT.apiRoute           = '%%APIROUTE%%';
  MESSAGEBOT.teamId             = '%%TEAMID%%';
  MESSAGEBOT.cookieName         = '%%CLIENT:TRACKING:WEB:COOKIENAME%%';
  MESSAGEBOT.initialized        = false;
  MESSAGEBOT.cookieExpiry       = %%CLIENT:TRACKING:WEB:COOKIEEXPIRY%%;
  MESSAGEBOT.pollDelay          = 500;

  MESSAGEBOT.data = {
    person: null,
    q: [],
  };

  MESSAGEBOT.init = function(guid, callback){
    if(!callback && typeof guid === 'function'){ callback = guid; guid = null; }
    if(!callback){ callback = MESSAGEBOT.loggerCallback; }

    if(!guid){
      MESSAGEBOT.person.create(function(error){
        if(!error){ MESSAGEBOT.initialized = true; }
        callback(error);
      });
    }else{
      MESSAGEBOT.data.person = {guid: guid};
      MESSAGEBOT.person.hydrate(function(error){
        if(error === 'person (' + guid + ') not found'){
          MESSAGEBOT.person.create(function(error){
            if(!error){ MESSAGEBOT.initialized = true; }
            callback(error);
          });
        }else{
          if(!error){ MESSAGEBOT.initialized = true; }
          callback(error);
        }
      });
    }
  };

  /* -- PERSON --*/

  MESSAGEBOT.person = {
    create: function(callback){
      if(!callback){ callback = MESSAGEBOT.loggerCallback; }

      var params = {};
      Object.keys(MESSAGEBOT.data.person).forEach(function(k){
        params[k] = MESSAGEBOT.data.person[k];
      });

      MESSAGEBOT.action('/person', 'POST', params, function(response){
        if(response.error){ return callback(response.error); };
        MESSAGEBOT.data.person = {guid: response.guid};
        MESSAGEBOT.cookies.create(MESSAGEBOT.cookieName, MESSAGEBOT.data.person.guid);
        return callback(null, MESSAGEBOT.person);
      });
    },

    hydrate: function(callback){
      if(!callback){ callback = MESSAGEBOT.loggerCallback; }
      if(!MESSAGEBOT.data.person){ return callback(new Error('Not Initialized')); }

      MESSAGEBOT.action('/person', 'GET', {
        guid: MESSAGEBOT.data.person.guid
      }, function(response){
        if(response.error){ return callback(response.error); };
        MESSAGEBOT.data.person = response.person;
        MESSAGEBOT.cookies.create(MESSAGEBOT.cookieName, MESSAGEBOT.data.person.guid);
        return callback(null, MESSAGEBOT.data.person);
      });
    },

    edit: function(data, callback){
      if(!callback){ callback = MESSAGEBOT.loggerCallback; }
      if(!MESSAGEBOT.data.person){ return callback(new Error('Not Initialized')); }

      MESSAGEBOT.action('/person', 'PUT', {
        guid: MESSAGEBOT.data.person.guid,
        data: data,
      }, function(response){
        return callback(response.error, response.person);
      });
    },

    opt: function(data, callback){
      if(!callback){ callback = MESSAGEBOT.loggerCallback; }
      if(!MESSAGEBOT.data.person){ return callback(new Error('Not Initialized')); }
      var params = {guid: MESSAGEBOT.data.person.guid};
      params.listId = data.listId,
      params.global = data.global,
      params.direction = data.direction,

      MESSAGEBOT.action('/person/opt', 'PUT', params, function(response){
        return callback(response.error);
      });
    },

    delete: function(callback){
      if(!callback){ callback = MESSAGEBOT.loggerCallback; }
      if(!MESSAGEBOT.data.person){ return callback(new Error('Not Initialized')); }

      MESSAGEBOT.action('/person', 'DELETE', {
        guid: MESSAGEBOT.data.person.guid
      }, function(response){
        if(response.error){ return callback(response.error); }
        MESSAGEBOT.cookies.delete(MESSAGEBOT.cookieName);
        return callback(null);
      });
    },
  };

  // Auto-Init should we have the proper cookie (no need to hydrate again)
  // Also increase the lifepan of the cookie
  var cookieGuid = MESSAGEBOT.cookies.read(MESSAGEBOT.cookieName);
  if(cookieGuid){
    MESSAGEBOT.data.person = {guid: cookieGuid};
    MESSAGEBOT.cookies.create(MESSAGEBOT.cookieName, MESSAGEBOT.data.person.guid);
    MESSAGEBOT.initialized = true;
  }

  // start the event poller
  MESSAGEBOT.poll = function(){
    clearTimeout(MESSAGEBOT.timer);

    var work = function(){
      if(MESSAGEBOT.initialized === false){
        return MESSAGEBOT.poll();
      }

      if(MESSAGEBOT.data.q.length === 0){
        return;
      }

      var e = MESSAGEBOT.data.q.shift();
      var event = MESSAGEBOT.getTrackingParams();
      for(var i in e){
        if(i !== 'data'){ event[i] = e[i]; }
      }

      for(var i in e.data){ event.data[i] = e.data[i]; }

      event.personGuid = MESSAGEBOT.data.person.guid;

      MESSAGEBOT.action('/event', 'POST', event, function(response){
        MESSAGEBOT.loggerCallback(response.error);
        MESSAGEBOT.poll();
      });
    };

    MESSAGEBOT.timer = setTimeout(work, MESSAGEBOT.pollDelay);
  };

  MESSAGEBOT.poll();

  /* -- EVENTS --*/

  MESSAGEBOT.track = function(data){
    MESSAGEBOT.data.q.push(data);
    MESSAGEBOT.poll();
  };

}());
