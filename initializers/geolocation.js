var MaxMind = require('maxmind');

module.exports = {
  loadPriority:  1000,

  initialize: function(api, next){
    api.maxmind = MaxMind.open(process.env.MAXMIND_DB);

    api.geolocation = {
      build: function(params, ip){
        if(params.lat && params.lon){
          return {
            lat: params.lat,
            lon: params.location
          };
        }else if(ip){
          try{
            var geoDetails = api.maxmind.get(ip);
            if(
              geoDetails &&
              geoDetails.location &&
              geoDetails.location.latitude &&
              geoDetails.location.longitude
            ){
              return {
                lat: geoDetails.location.latitude,
                lon: geoDetails.location.longitude
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
