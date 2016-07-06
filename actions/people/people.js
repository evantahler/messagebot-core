var dateformat = require('dateformat');

var alias = function(api){
  return api.env + '-' + 'people';
};

exports.peopleSearch = {
  name:                   'people:search',
  description:            'people:search',
  outputExample:          {},
  middleware:             ['logged-in-session', 'status-required-admin' ],

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
    api.elasticsearch.search(alias(api), data.params.searchKeys, data.params.searchValues, data.params.from, data.params.size, data.params.sort, function(error, results, total){
      if(error){ return next(error); }
      data.response.total  = total;
      data.response.people = results;
      next();
    });
  }
};

exports.peopleAggregation = {
  name:                   'people:aggregation',
  description:            'people:aggregation',
  outputExample:          {},
  middleware:             ['logged-in-session', 'status-required-admin' ],

  inputs: {
    start:        {
      required: false,
      formatter: function(p){ return new Date(parseInt(p)); },
      default:   function(p){ return 0; },
    },
    end:          {
      required: false,
      formatter: function(p){ return new Date(parseInt(p)); },
      default:   function(p){ return new Date().getTime(); },
    },
    interval: { required: false }
  },

  run: function(api, data, next){
    api.elasticsearch.aggregation(
      alias(api),
      ['guid'],
      ['_exists'],
      data.params.start,
      data.params.end,
      'createdAt',
      'date_histogram',
      'createdAt',
      data.params.interval,
      function(error, buckets){
        if(error){ return next(error); }
        data.response.aggregations = {created: buckets.buckets};
        next();
      }
    );
  }
};
