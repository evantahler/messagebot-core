#!/usr/bin/env node

var async         = require('async');
var dateformat    = require('dateformat');
var request       = require('request');
var faker         = require('faker');

var ActionHeroPrototype = require(__dirname + '/../../node_modules/actionhero/actionhero.js').actionheroPrototype;
var actionhero = new ActionHeroPrototype();
var configChanges = {
  logger:  { transports: null },
  general: { developmentMode: false }
};

var usersCount = process.env.USERS_COUNT || 1000;
var jobs = [];

// only create entries within a 1-month window
var start = new Date()
start.setMonth(start.getMonth() - 1);
var end = new Date()

var funnel = [
  { pages: ['index.html'],                                                rate: 1.00 },
  { pages: ['about.html', 'learn_more.html'],                             rate: 0.50 },
  { pages: ['signup.html', 'log-in.html'],                                rate: 0.50 },
  { pages: ['cool-hat.html', 'aweseome-shoes.html', 'ugly-sweater.html'], rate: 0.30 },
  { pages: ['cart.html'],                                                 rate: 0.50 },
  { pages: ['checkout.html'],                                             rate: 0.50 },
  { pages: ['thank-you.html'],                                            rate: 0.99 },
]

var seed = function(api, callback){

  var routeBase = 'http://' + api.config.servers.web.bindIP + ':' + api.config.servers.web.port;

  var i = 0;
  while(i < usersCount){
    jobs.push(function(done){
      var localJobs = [];
      var person;
      var counter = 0;
      var progress = true;
      var time = faker.date.between(start, end);
      var ip = faker.internet.ip();
      var message = '';
      var pages = [];

      // create the person
      localJobs.push(function(next){

        var firstName = faker.name.firstName();
        var lastName = faker.name.lastName();

        var payload = {
          createdAt: time.getTime(),
          data: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: firstName + '.' + lastName + '@fake.com',
            acquisitionSource: 'web'
          })
        };

        request.post(routeBase + '/api/person', {form: payload}, function(error, data){
          person = JSON.parse(data.body);
          message += 'creted `' + firstName + ' ' + lastName + '` + ['
          next(error);
        });
      });

      while(counter < funnel.length && progress === true){

        if(Math.random() <= funnel[counter].rate){
          (function(counter){
            localJobs.push(function(next){
              var page = funnel[counter].pages[Math.floor(Math.random() * funnel[counter].pages.length)];

              var payload = {
                createdAt: (new Date(time.getTime() + (1000 * 60 * counter))).getTime(),
                userGuid: person.guid,
                type: 'pageview',
                ip: ip,
                data: JSON.stringify({
                  page: page,
                })
              };

              request.post(routeBase + '/api/event', {form: payload}, function(error){
                if(!error){ pages.push(page); }

                if(page === 'thank-you.html'){
                  var payload = {
                    createdAt: (new Date(time.getTime() + (1000 * 60 * counter))).getTime(),
                    userGuid: person.guid,
                    type: 'purchase',
                    ip: ip,
                    data: JSON.stringify({
                      page: page,
                      value: Math.round(Math.random() * 100)
                    })
                  };

                  request.post(routeBase + '/api/event', {form: payload}, next);
                }else{
                  next(error);
                }
              });
            });
          })(counter);
        }else{
          progress = false;
        }

        counter++;
      }

      async.series(localJobs, function(error){
        message += pages.join(', ') + ']';
        if(!error){ console.log(message); }
        done(error);
      });
    });
    i++;
  }

  async.series(jobs, callback);
}

if(require.main === module){
  actionhero.initialize({configChanges: configChanges}, function(error, api){
    if(error){ return end(error); }
    console.log('seeding env with fake data: ' + api.env);
    seed(api, function(error){
      if(error){ throw error; }
      else{ process.exit(); }
    });
  });
}

exports.seed = seed;
