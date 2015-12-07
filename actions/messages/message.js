var dateformat = require('dateformat');

var alias = function(api){
  return  'messages';
};

var index = function(api){
  var thisMonth = dateformat(new Date(), 'yyyy-mm');
  return api.env + '-' + alias(api) + '-' + thisMonth;
};

exports.messageCreate = {
  name:                   'message:create',
  description:            'message:create',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:      { required: false },
    userGuid:  { required: true  },
    type:      { required: true  },
    body:      { required: true  },
    data:      { required: false },
    sentAt:    { required: false  },
    readAt:    { required: false  },
    actedAt:   { required: false  },
  },

  run: function(api, data, next){
    var message = new api.models.message(index(api));

    if(data.params.guid){     message.data.guid = data.params.guid;         }
    if(data.params.userGuid){ message.data.userGuid = data.params.userGuid; }
    if(data.params.type){     message.data.type = data.params.type;         }
    if(data.params.body){     message.data.body = data.params.body;         }
    if(data.params.sentAt){   message.data.sentAt = data.params.sentAt;     }
    if(data.params.readAt){   message.data.readAt = data.params.readAt;     }
    if(data.params.actedAt){  message.data.actedAt = data.params.actedAt;   }

    for(var i in data.params.data){
      if(message.data[i] === null || message.data[i] === undefined){
        message.data[i] = data.params.data[i];
      }
    }

    message.create(next);
  }
};

exports.messageEdit = {
  name:                   'message:edit',
  description:            'message:edit',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:      { required: true  },
    userGuid:  { required: false },
    type:      { required: false },
    body:      { required: false },
    data:      { required: false },
    sentAt:    { required: false },
    readAt:    { required: false },
    actedAt:   { required: false },
  },

  run: function(api, data, next){
    var message = new api.models.message(index(api), data.params.guid);
    
    if(data.params.guid){     message.data.guid = data.params.guid;         }
    if(data.params.userGuid){ message.data.userGuid = data.params.userGuid; }
    if(data.params.type){     message.data.type = data.params.type;         }
    if(data.params.body){     message.data.body = data.params.body;         }
    if(data.params.sentAt){   message.data.sentAt = data.params.sentAt;     }
    if(data.params.readAt){   message.data.readAt = data.params.readAt;     }
    if(data.params.actedAt){  message.data.actedAt = data.params.actedAt;   }

    for(var i in data.params.data){
      if(message.data[i] === null || message.data[i] === undefined){
        message.data[i] = data.params.data[i];
      }
    }

    message.edit(next);
  }
};

exports.messageView = {
  name:                   'message:view',
  description:            'message:view',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
  },

  run: function(api, data, next){
    var message = new api.models.message(alias(api), data.params.guid);
    message.hydrate(function(error){
      if(error){ return next(error); }
      data.response.message = message.data;
      next();
    });
  }
};

exports.messageDelete = {
  name:                   'message:delete',
  description:            'message:delete',
  outputExample:          {},
  middleware:             [],

  inputs: {
    guid:         { required: true },
  },

  run: function(api, data, next){
    var message = new api.models.message(alias(api), data.params.guid);
    message.delete(function(error){
      if(error){ return next(error); }
      next();
    });
  }
};