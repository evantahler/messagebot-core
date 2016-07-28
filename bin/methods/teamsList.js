var async = require('async');
var Table = require('easy-table');
var api;

var teamsList = function(api, callback){
  var jobs = [];

  jobs.push(function(done){
    api.sequelize.connect(done);
  });

  jobs.push(function(done){
    api.models.team.findAll({oder: ['id', 'asc']}).then(function(teams){
      var tableData = [];
      teams.forEach(function(team){ tableData.push(team.apiData()); });

      console.log(teams.length + ' Total Teams\r\n');
      console.log(Table.print(tableData));

      done();
    }).catch(done);
  });

  async.series(jobs, callback);
};

module.exports = teamsList;
