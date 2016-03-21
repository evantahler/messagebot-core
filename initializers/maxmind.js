var maxmind = require('maxmind');

module.exports = {
  loadPriority:  1000,

  initialize: function(api, next){
    maxmind.init(process.env.MAXMIND_DB);
    api.maxmind = maxmind;

    next();
  },
};
