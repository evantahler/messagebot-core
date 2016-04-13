module.exports = {
  "settings": {
    "number_of_shards": parseInt(process.env.NUMBER_OF_SHARDS || 10),
    "number_of_replicas": parseInt(process.env.NUMBER_OF_REPLICAS || 0)
  },

  "mappings": {
    "event": {

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
        "guid":       { "type": "string"   },

        "ip":         { "type": "string"   },
        "device":     { "type": "string"   },
        "userGuid":   { "type": "string"   },
        "type":       { "type": "string"   },

        "data":       { "type": "object", "index": "not_analyzed" },

        "location":   {
          "type": "geo_point",
          "geohash_precision": "1km"
        },

        "createdAt":  { "type":  "date" },
        "updatedAt":  { "type":  "date" }
      }
    }
  },

  "warmers" : {},

  "aliases" : {"events": {}}
};
