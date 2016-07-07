var dateformat = require('dateformat');
var async      = require('async');

var alias = function(api){
  return api.env + '-' + 'messages';
};

exports.messagesSearch = {
  name:                   'messages:search',
  description:            'messages:search',
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
      data.response.total    = total;
      data.response.messages = results;
      next();
    });
  }
};

exports.messagesAggregation = {
  name:                   'messages:aggregation',
  description:            'messages:aggregation',
  outputExample:          {},
  middleware:             ['logged-in-session', 'status-required-admin' ],

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
    interval: { required: false }
  },

  run: function(api, data, next){
    var jobs = [];
    var aggJobs = [];
    var transports = [];
    data.response.aggregations = {};

    jobs.push(function(done){
      api.elasticsearch.distinct(
        alias(api),
        data.params.searchKeys,
        data.params.searchValues,
        data.params.start,
        data.params.end,
        'createdAt',
        'transport',
        function(error, buckets){
          if(error){ return done(error); }
          buckets.buckets.forEach(function(b){
            transports.push(b.key);
          });
          done();
        }
      );
    });

    jobs.push(function(done){
      transports.forEach(function(transport){
        aggJobs.push(function(aggDone){
          api.elasticsearch.aggregation(
            alias(api),
            ['transport'].concat(data.params.searchKeys),
            [transport].concat(data.params.searchValues),
            data.params.start,
            data.params.end,
            'createdAt',
            'date_histogram',
            'createdAt',
            data.params.interval,
            function(error, buckets){
              if(error){ return aggDone(error); }
              data.response.aggregations[transport] = buckets.buckets;
              aggDone();
            }
          );
        });
      });

      done();
    });

    jobs.push(function(done){
      async.series(aggJobs, done);
    });

    async.series(jobs, next);
  }
};
