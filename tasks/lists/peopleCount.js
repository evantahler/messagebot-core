'use strict';

exports.task = {
  name:          'lists:peopleCount',
  description:   'lists:peopleCount',
  frequency:     0,
  queue:         'default',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    api.models.list.findOne({
      where: {id: params.listId}
    }).then(function(list){
      if(!list){ return next(new Error('list not found')); }
      api.lists.getPeople(params.listId, function(error, userGuids){
        if(error){ return next(error); }
        list.updateAttributes({
          peopleCount: userGuids.length,
          peopleCountedAt: (new Date()),
        }).then(function(){
          next(null, {
            listId: list.id,
            count: userGuids.length
          });
        }).catch(next);
      });
    });
  }
};
