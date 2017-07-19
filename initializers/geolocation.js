var MaxMind = require('maxmind')

module.exports = {
  loadPriority: 1000,

  initialize: function (api, next) {
    api.maxmind = MaxMind.open(process.env.MAXMIND_DB, {
      cache: {
        max: 1000, // max items in cache
        maxAge: 1000 * 60 * 60 // life time in milliseconds
      }
    })

    api.geolocation = {
      build: function (params, ip) {
        if (params.lat && params.lng) {
          return {
            lat: params.lat,
            lng: params.location
          }
        } else if (ip) {
          try {
            var geoDetails = api.maxmind.get(ip)
            if (
              geoDetails &&
              geoDetails.location &&
              geoDetails.location.latitude &&
              geoDetails.location.longitude
            ) {
              return {
                lat: geoDetails.location.latitude,
                lng: geoDetails.location.longitude
              }
            }
          } catch (e) {
            api.log('Geocoding Error: ' + String(e), 'error')
          }
        }
      }
    }

    next()
  }
}
