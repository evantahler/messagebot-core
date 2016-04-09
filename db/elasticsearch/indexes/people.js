module.exports = {
  "settings": {
    "number_of_shards": parseInt(process.env.NUMBER_OF_SHARDS || 10),
    "number_of_replicas": parseInt(process.env.NUMBER_OF_REPLICAS || 0)
  },

  "mappings": {
    "person": {
      "properties": {
        "guid":        { "type": "string"  },

        "lists":       { "type": "string"  },

        "data":        { "type": "object"  },
        "permissions": { "type": "object"  },

        "createdAt":   { "type":  "date" },
        "updatedAt":   { "type":  "date" }
      }
    }
  },

  "warmers" : {},

  "aliases" : {"people": {}}
};
