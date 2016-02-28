exports.default = {
  messagebot: function(api){
    return {
      tracking: {
        maxPendingOperations: 10000,
      }
    };
  }
};
