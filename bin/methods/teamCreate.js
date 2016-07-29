var async    = require('async');
var Table    = require('easy-table');
var optimist = require('optimist');
var faker    = require('faker');
var api;

var teamCreate = function(api, callback){
  var jobs = [];
  var team;
  var user;
  var person;

  var argv = optimist
    .demand('name')
    .demand('trackingDomainRegexp')
    .demand('trackingDomain')
    .default('email', 'admin@localhost.com')
    .default('password', faker.internet.password())
    .argv;

  jobs.push(function(done){
    api.sequelize.connect(done);
  });

  jobs.push(function(done){
    team = api.models.team.build(argv);
    team.save().then(function(){
      var tableData = [team.apiData()];

      console.log('New Team\r\n');
      console.log(Table.print(tableData));

      done();
    }).catch(done);
  });

  jobs.push(function(done){
    console.log('Migrating ElasticSearch for Team #' + team.id + ', (' + team.name + ')');
    api.utils.doShell(['PREFIX="' + team.id + '" node ./node_modules/.bin/ah-elasticsearch-orm migrate'], function(error, lines){
      console.log(lines);
      done(error);
    }, true);
  });

  jobs.push(function(done){
    user = api.models.user.build({
      email: argv.email,
      teamId: team.id,
      role: 'admin',
      firstName: 'admin',
      lastName: 'admin',
    });

    user.updatePassword(argv.password, done);
  });

  jobs.push(function(done){
    person = new api.models.person(team);

    ['email', 'firstName', 'lastName', 'role'].forEach(function(p){
      person.data[p] = user[p];
    });

    person.data.source = 'admin';
    person.data.device = 'unknown';
    person.data.teamId = team.id;

    person.create(done);
  });

  jobs.push(function(done){
    user.personGuid = person.data.guid;
    user.save().then(function(){
      var tableData = [user.apiData()];

      console.log('New User');
      console.log('Email: ' + argv.email);
      console.log('Password: ' + argv.password + '\r\n');
      console.log(Table.print(tableData));

      done();
    }).catch(done);
  });

  async.series(jobs, callback);
};

module.exports = teamCreate;
