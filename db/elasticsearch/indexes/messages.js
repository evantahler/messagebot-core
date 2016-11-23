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
    'message': {

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
        'guid': { 'type': 'string', 'required': true },
        'createdAt': { 'type': 'date', 'required': true },
        'updatedAt': { 'type': 'date', 'required': true },
        'data': { 'type': 'object', 'required': true },

        'personGuid': { 'type': 'string', 'required': true },
        'campaignId': { 'type': 'integer', 'required': true },
        'transport': { 'type': 'string', 'required': true },
        'body': { 'type': 'string', 'required': true },
        'sentAt': { 'type': 'date', 'required': false },
        'readAt': { 'type': 'date', 'required': false },
        'actedAt': { 'type': 'date', 'required': false }
      }
    }
  },

  'warmers': {},

  'aliases': {'messages': {}}
}
