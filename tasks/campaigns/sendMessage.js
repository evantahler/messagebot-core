'use strict';

var async = require('async');

exports.task = {
  name:          'campaigns:sendMessage',
  description:   'campaigns:sendMessage',
  frequency:     0,
  queue:         'messagebot:campaigns',
  plugins:       [],
  pluginOptions: {},

  run: function(api, params, next){
    var jobs = [];
    var campaign;
    var list;
    var listPerson;
    var person;
    var body;
    var view;
    var transport;
    var message;
    var team;

    jobs.push(function(done){
      api.models.campaign.findOne({where: {id: params.campaignId}}).then(function(c){
        campaign = c;
        if(!campaign){ return done(new Error('campaign not found')); }
        done();
      }).catch(done);
    });

    jobs.push(function(done){
      api.models.list.findOne({where: {id: params.listId}}).then(function(l){
        list = l;
        if(!list){ return done(new Error('list not found')); }
        done();
      }).catch(done);
    });

    jobs.push(function(done){
      api.models.listPerson.findOne({where: {
        personGuid: params.personGuid,
        listId: list.id,
      }}).then(function(lp){
        listPerson = lp;
        if(!listPerson){ return done(new Error('listPerson not found')); }
        done();
      }).catch(done);
    });

    jobs.push(function(done){
      api.models.team.findOne({where: {id: campaign.teamId}}).then(function(t){
        team = t;
        if(!team){ return done(new Error('team not found')); }
        done();
      }).catch(done);
    });

    jobs.push(function(done){
      message = new api.models.message(team);
      message.ensureGuid();
      done();
    });

    jobs.push(function(done){
      person = new api.models.person(team, listPerson.personGuid);
      person.hydrate(function(error){
        if(error){ return done(error); }
        done();
      });
    });

    jobs.push(function(done){
      api.models.template.find({where: {id: campaign.templateId}}).then(function(template){
        template.render(person, message, function(error, _body, _view){
          if(error){ return done(error); }
          body = _body;
          view = _view;
          done();
        });
      });
    });

    jobs.push(function(done){
      api.transports.forEach(function(t){
        if(t.name === campaign.transport){ transport = t; }
        if(!transport){ return done(new Error('transport not found')); }

        var missingKey;
        transport.requiredDataKeys.person.forEach(function(k){
          if(!person.data.data[k]){ missingKey = k; }
        });

        // TODO: Event validation

        if(missingKey){ return done(new Error('person missing data.' + missingKey)); }
        done();
      });
    });

    jobs.push(function(done){
      Object.keys(campaign.campaignVariables).forEach(function(k){
        message.data[k] = campaign.campaignVariables[k];
      });

      message.data.personGuid = person.data.guid;
      message.data.transport  = transport.name;
      message.data.campaignId = campaign.id;
      message.data.body       = body;
      // message.data.view       = view;
      message.data.sentAt     = new Date();

      message.create(done);
    });

    jobs.push(function(done){
      if(api.env !== 'test'){
        var sendParams = {body: body};
        transport.campaignVariables.forEach(function(v){
          sendParams[v] = campaign.campaignVariables[v];
        });

        transport.deliver(sendParams, person, done);
      }else{
        api.log('not sending messages in env=test');
        done();
      }
    });

    async.series(jobs, next);
  }
};
