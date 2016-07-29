var async    = require('async');
var optimist = require('optimist');
var Table    = require('easy-table');
var api;

var teamDelete = function(api, callback){
  var jobs = [];
  var team;

  var argv = optimist.demand('id').argv;

  jobs.push(function(done){
    api.sequelize.connect(done);
  });

  jobs.push(function(done){
    api.models.team.findOne({where: {id: argv.id}}).then(function(_team){
      if(!_team){ return done(new Error('Team not found')); }
      team = _team;

      console.log('About to Delete Team\r\n');
      var tableData = [team.apiData()];
      console.log(Table.print(tableData));

      done();
    }).catch(done);
  });

  jobs.push(function(done){
    console.log('Deleting all ElasticSearch data for Team #' + team.id + ', (' + team.name + ')');
    var command = 'curl -s -X DELETE';
    command += ' ' + api.config.elasticsearch.urls[0];
    command += '/' + team.id + '-' + api.env + '-*';
    api.utils.doBash([command], function(error, lines){
      console.log(lines);
      done(error);
    }, true);
  });

  ['user', 'listPerson', 'list', 'campaign', 'template'].forEach(function(model){
    jobs.push(function(done){
      console.log('Delting all objects for team from table `' + model + '`');
      api.models[model].destroy({where: {teamId: team.id}}).then(function(){
        done();
      }).catch(done);
    });
  });

  jobs.push(function(done){
    console.log('Deleting team');
    team.destroy().then(function(){ done(); }).catch(done);
  });

  async.series(jobs, callback);
};

module.exports = teamDelete;
