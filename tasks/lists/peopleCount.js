'use strict';

exports.task = {
  name:          'lists:peopleCount',
  description:   'lists:peopleCount',
  frequency:     0,
  queue:         'messagebot:lists',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    api.models.list.findOne({
      where: {id: params.listId}
    }).then(function(list){
      if(!list){ return next(new Error('list not found')); }

      list.associateListPeople(function(error, count){
        if(error){ return next(error); }
        list.updateAttributes({
          peopleCount: count,
          peopleCountedAt: (new Date()),
        }).then(function(){
          next(null, {
            listId: list.id,
            count: count
          });
        }).catch(next);
      });
    }).catch(next);
  }
};
