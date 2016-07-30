'use strict';

var async = require('async');

exports.task = {
  name:          'people:buildCreateEvent',
  description:   'people:buildCreateEvent',
  frequency:     0,
  queue:         'messagebot:people',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var jobs = [];
    var team;
    var person;
    var event;

    jobs.push(function(done){
      api.models.team.findOne({where: {id: params.teamId}}).then(function(_team){
        team = _team;
        done();
      }).catch(done);
    });

    jobs.push(function(done){
      person = new api.models.person(team, params.guid);
      person.hydrate(done);
    });

    jobs.push(function(done){
      event = new api.models.event(team);
      event.data.personGuid = person.data.guid;
      event.data.type = 'person_created';
      event.data.ip = 'internal';
      event.data.device = person.data.device;
      event.create(done);
    });

    async.series(jobs, next);
  }
};
