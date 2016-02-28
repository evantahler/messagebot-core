exports.task = {
  name:          'tracking:messages',
  description:   'tracking:messages',
  frequency:     1000 * 10,
  queue:         'tracking',
  plugins:       [],
  pluginOptions: {},

  run: function(api, data, next){
    var limit = api.config.messagebot.tracking.maxProcessingPerTask;
    var modes = ['create', 'edit'];
    var totalItems = 0;
    var mode;

    var work = function(){
      mode = modes.pop();
      if(!mode){ return next(null, {totalItems: totalItems}); }
      processItem(function(error, gotItem){
        if(error){ return next(error); }
        if(gotItem){ modes.push(mode); }
        work();
      });
    };

    var processItem = function(callback){
      var key = 'messagebot:track:messages:' + mode;
      api.cache.pop(key, function(error, item){
        if(error){ return callback(error); }
        if(!item){ return callback(null, false); }
        item.action = item.action.replace(':delayed', '');
        api.utils.runAction(item, function(error){
          totalItems++;
          if(error){ return callback(error); }
          return callback(null, true);
        });
      });
    };

    work();
  }
};
