var maxmind = require('maxmind');

module.exports = {
  loadPriority:  1000,

  initialize: function(api, next){
    maxmind.init(process.env.MAXMIND_DB);
    api.maxmind = maxmind;

    api.geolocation = {
      build: function(params, ip){
        if(params.lat && params.lon){
          return {
            lat: params.lat,
            lon: params.location
          };
        }else if(ip){
          try{
            var location = api.maxmind.getLocation(ip);
            if(location && location.latitude && location.longitude){
              return {
                lat: location.latitude,
                lon: location.longitude
              };
            }
          }catch(e){
            api.log('Geocoding Error: ' +  String(e), 'error');
          }
        }
      }
    };

    next();
  },
};
