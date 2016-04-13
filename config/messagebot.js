exports.default = {
  messagebot: function(api){
    return {
      // when attempting to create a elasticsearch instance, we will check if any of these
      // attributes have an exact match.  If there is, we'll merge with the existing instance
      // the order in this array is priority
      uniqueFields: {
        person: [
          'email',
          'phoneNumber',
          'token',
          'pushToken',
          'guid',
        ],
        event: [
          'guid',
        ],
        message: [
          'guid',
        ]
      },

      // if the API (server) has this many pending elasticsearch operations
      // it will denote itself as busy and stop taking new requests until the
      // internal queue can drain
      tracking: {
        maxPendingOperations: 10000,
      }
    };
  }
};
