exports.default = {
  messagebot: function(api){
    return {
      tracking: {
        maxQueueLength: 10000,
        maxProcessingPerTask: 100,
      }
    };
  }
};
