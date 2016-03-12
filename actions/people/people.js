var dateformat = require('dateformat');

var alias = function(api){
  return api.env + '-' + 'people';
};

exports.peopleSearch = {
  name:                   'people:search',
  description:            'people:search',
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
  middleware:             [],

  inputs: {
    searchKeys:   { required: true },
    searchValues: { required: true },
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
    dateField:    {
      required: true,
      default: function(){ return 'createdAt'; }
    },
    agg:          {
      required: true,
      default: function(){ return 'cardinality'; }
    },
    aggField: {
      required: true,
      default: function(){ return 'guid'; }
    },
    interval: { required: false }
  },

  run: function(api, data, next){
    api.elasticsearch.aggregation(alias(api), data.params.searchKeys, data.params.searchValues, data.params.start, data.params.end, data.params.dateField, data.params.agg, data.params.aggField, data.params.interval, function(error, value){
      if(error){ return next(error); }
      data.response.value = value;
      next();
    });
  }
};
