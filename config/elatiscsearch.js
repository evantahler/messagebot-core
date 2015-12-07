exports.default = { 
  elasticsearch: function(api){
    return {
      urls: process.env.ELASTICSEARCH_URLS.split(','),
      log: {
        type: 'file',
        level: 'trace',
        path: __dirname + '/../log/elasticsearch.log'
      }
    };
  }
};

exports.test = { 
  elasticsearch: function(api){
    return {
      urls: [ 'http://localhost:9200' ],
    };
  }
};
