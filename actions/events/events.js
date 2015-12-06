var dateformat = require('dateformat');

var alias = function(api){
  return  'events';
};

exports.eventsSearch = {
  name:                   'events:search',
  description:            'events:search',
  outputExample:          {},
  middleware:             [],

  inputs: {
    searchKeys:   { required: true },
    searchValues: { required: true },
    from:         { 
      required: false,
      formatter: function(p){ return parseInt(p); },
      default:   function(p){ return 0; },
    },
    size:         {
      required: false,
      formatter: function(p){ return parseInt(p); },
      default:   function(p){ return 100; },
    },
    sort:         { required: false },
  },

  run: function(api, data, next){
    api.elasticsearch.search(alias(api), data.params.searchKeys, data.params.searchValues, data.params.from, data.params.size, data.params.sort, function(error, results){
      if(error){ return next(error); }
      data.response.events = results;
      next();
    });
  }
};
