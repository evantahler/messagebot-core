exports.default = {
  messagebot: function(api){
    return {
      // What is the public URL of this server?  We use this to build tracking links, etc
      url: process.env.URL,
      // we need a temprorary place on disk to render messages
      tmpPath: '/tmp/messagebot',
      // we'll delete files in the temprorary folder after they are this old (ms)
      tmpFileLifespan: (1000 * 60),

      // when attempting to create a elasticsearch object's instance, we will check if any of these
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
        maxPendingOperations: 100,
      }
    };
  }
};
