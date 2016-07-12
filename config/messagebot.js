exports.default = {
  messagebot: function(api){
    return {
      // What is the public URL of this server?  We use this to build tracking links, etc
      url: process.env.URL,
      // we need a temprorary place on disk to render messages
      tmpPath: '/tmp/messagebot',
      // we'll delete files in the temprorary folder after they are this old (ms)
      tmpFileLifespan: (1000 * 60),

      // if the API (server) has this many pending elasticsearch operations
      // it will denote itself as busy and stop taking new requests until the
      // internal queue can drain
      tracking: {
        maxPendingOperations: 100,
      }
    };
  }
};
