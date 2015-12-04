var dateformat = require('dateformat');

var alias = function(api){
  return  'people';
};

var index = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return api.env + '-' + alias(api) + '-' + thisMonth;
};

exports.peopleSearch = {
  name:                   'people:search',
  description:            'people:search',
  outputExample:          {},
  middleware:             [],

  inputs: {
    searchKeys:   { required: true },
    searchValues: { required: true },
  },

  run: function(api, data, next){
    api.elasticsearch.search(alias(api), data.params.searchKeys, data.params.searchValues, function(error, results){
      if(error){ return next(error); }
      data.response.people = results;
      next();
    });
  }
};
