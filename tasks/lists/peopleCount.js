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

      if(list.type === 'dynamic'){
        api.lists.getPeople(params.listId, function(error, personGuids){
          if(error){ return next(error); }
          list.updateAttributes({
            peopleCount: personGuids.length,
            peopleCountedAt: (new Date()),
          }).then(function(){
            next(null, {
              listId: list.id,
              count: personGuids.length
            });
          }).catch(next);
        });
      }

      else if(list.type === 'static'){
        api.models.listPerson.count({
          where:{ listId: params.listId }
        }).then(function(count){
          list.updateAttributes({
            peopleCount: count,
            peopleCountedAt: (new Date()),
          }).then(function(){
            next(null, {
              listId: list.id,
              count: count
            });
          }).catch(next);
        }).catch(next);
      }

      else{ next(new Error(list.type + ' is not something I know how to count')); }

    });
  }
};
