module.exports = {
  'settings': {
    'number_of_shards': parseInt(process.env.NUMBER_OF_SHARDS || 10),
    'number_of_replicas': parseInt(process.env.NUMBER_OF_REPLICAS || 0),
    'index': {
      'analysis': {
        'analyzer': {
          'analyzer_keyword': {
            'tokenizer': 'keyword',
            'filter': 'lowercase'
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
              'analyzer': 'analyzer_keyword'
            }
          }
        }
      ],

      'properties': {
        'guid': { 'type': 'keyword', 'required': true },
        'createdAt': { 'type': 'date', 'required': true },
        'updatedAt': { 'type': 'date', 'required': true },
        'data': { 'type': 'object', 'required': true },

        'ip': { 'type': 'keyword', 'required': true },
        'device': { 'type': 'keyword', 'required': true },
        'personGuid': { 'type': 'keyword', 'required': true },
        'messageGuid': { 'type': 'keyword', 'required': false },
        'type': { 'type': 'keyword', 'required': true },

        'location': {
          'type': 'geo_point',
          // 'geohash_precision': (process.env.GEOHASH_PRECISION || '1km'),
          'required': false
        }
      }
    }
  },

  'warmers': {},

  'aliases': {'events': {}}
}
