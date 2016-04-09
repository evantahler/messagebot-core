module.exports = {
  "settings": {
    "number_of_shards": parseInt(process.env.NUMBER_OF_SHARDS || 10),
    "number_of_replicas": parseInt(process.env.NUMBER_OF_REPLICAS || 0)
  },

  "mappings": {
    "message": {
      "properties": {
        "guid":       { "type": "string" },

        "userGuid":  { "type": "string"  },
        "type":      { "type": "string"  },
        "body":      { "type": "string"  },

        "data":      { "type": "object"  },

        "createdAt": { "type":  "date" },
        "updatedAt": { "type":  "date" },
        "sentAt":    { "type":  "date" },
        "readAt":    { "type":  "date" },
        "actedAt":   { "type":  "date" }
      }
    }
  },

  "warmers" : {},

  "aliases" : {"messages": {}}
};
