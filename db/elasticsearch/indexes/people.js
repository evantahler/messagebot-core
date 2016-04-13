module.exports = {
  "settings": {
    "number_of_shards": parseInt(process.env.NUMBER_OF_SHARDS || 10),
    "number_of_replicas": parseInt(process.env.NUMBER_OF_REPLICAS || 0)
  },

  "mappings": {
    "person": {

      "dynamic_templates": [
        {
          "strings": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "string",
              "index": "not_analyzed",
            }
          }
        }
      ],

      "properties": {
        "guid":        { "type": "string"  },

        "lists":       { "type": "string"  },

        "data":        { "type": "object", "index": "not_analyzed" },
        "permissions": { "type": "object", "index": "not_analyzed" },

        "createdAt":   { "type":  "date" },
        "updatedAt":   { "type":  "date" }
      }
    }
  },

  "warmers" : {},

  "aliases" : {"people": {}}
};
