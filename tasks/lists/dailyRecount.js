'use strict';
var async = require('async');

exports.task = {
  name:          'lists:dailyRecount',
  description:   'lists:dailyRecount',
  frequency:     (1000 * 60 * 60 * 24),
  queue:         'default',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var jobs = [];

    api.models.list.findAll().then(function(lists){
      lists.forEach(function(list){
        jobs.push(function(done){
          api.tasks.enqueue('lists:peopleCount', {listId: list.id}, 'default', done);
        });
      });

      async.series(jobs, next);
    }).catch(next);
  }
};
