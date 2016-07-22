module.exports = {
  'settings': {
    'number_of_shards': parseInt(process.env.NUMBER_OF_SHARDS || 10),
    'number_of_replicas': parseInt(process.env.NUMBER_OF_REPLICAS || 0),
    'index':{
      'analysis':{
        'analyzer':{
          'analyzer_keyword':{
            'tokenizer':'keyword',
            'filter':'lowercase'
          }
        }
      }
    }
  },

  'mappings': {
    'event': {

      'dynamic_templates': [
        {
          'strings': {
            'match_mapping_type': 'string',
            'mapping': {
              'type': 'string',
              'analyzer':'analyzer_keyword',
            }
          }
        }
      ],

      'properties': {
        'guid':       { 'type': 'string' },
        'createdAt':  { 'type':  'date'  },
        'updatedAt':  { 'type':  'date'  },
        'data':       { 'type': 'object' },

        'ip':          { 'type': 'string' },
        'device':      { 'type': 'string' },
        'personGuid':  { 'type': 'string' },
        'messageGuid': { 'type': 'string' },
        'type':        { 'type': 'string' },

        'location': {
          'type': 'geo_point',
          'geohash_precision': (process.env.GEOHASH_PRECISION || '1km')
        },
      }
    }
  },

  'warmers' : {},

  'aliases' : {'events': {}}
};
