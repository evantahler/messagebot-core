var async   = require('async');
var common  = require(__dirname + '/common.js');
var sleep   = parseInt(process.env.SLEEP) || (1000 * 2.2);

var run = function(api){

  var routeBase = 'http://' + api.config.servers.web.bindIP + ':' + api.config.servers.web.port;
  var jobs = [];
  var person;
  var message = '';
  var end = new Date();
  var start = new Date(end.getTime() + 1);

  message += '[' + end.toString() + '] ';

  // create the person
  jobs.push(function(next){
    common.buildPerson(start, end, routeBase, function(error, _person){
      if(error){ throw error; }
      person = _person;
      message += 'Created `' + person.data.firstName + ' ' + person.data.lastName + '` + [';
      return next();
    });
  });

  // build events
  jobs.push(function(next){
    common.buildFunnel(person, routeBase, function(error, events){
      if(error){ throw error; }
      message += events.join(', ') + ']';
      return next();
    });
  });

  async.series(jobs, function(error){
    if(error){ throw(error); }
    console.log(message);
    setTimeout(run, sleep, api);
  });
};

if(require.main === module){
  common.connect(function(error, api){
    if(error){ throw(error); }
    console.log('Running Faker: ' + api.env);
    run(api);
  });
}

exports.run = run;
