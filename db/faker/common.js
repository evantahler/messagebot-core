var faker = require('faker')
var request = require('request')
var async = require('async')
var path = require('path')
var ActionHeroPrototype = require(path.join(__dirname, '/../../node_modules/actionhero/actionhero.js')).actionheroPrototype

exports.connect = function (callback) {
  var actionhero = new ActionHeroPrototype()
  var configChanges = {
    logger: { transports: null },
    general: { developmentMode: false }
  }
  actionhero.initialize({configChanges: configChanges}, callback)
}

exports.funnel = [
  { pages: ['index.html'], rate: 1.00 },
  { pages: ['about.html', 'learn_more.html'], rate: 0.50 },
  { pages: ['signup.html', 'log-in.html'], rate: 0.50 },
  { pages: ['cool-hat.html', 'aweseome-shoes.html', 'ugly-sweater.html'], rate: 0.30 },
  { pages: ['cart.html'], rate: 0.50 },
  { pages: ['checkout.html'], rate: 0.50 },
  { pages: ['thank-you.html'], rate: 0.99 }
]

exports.sources = ['web', 'iphone', 'android', 'referral']

exports.buildPerson = function (start, end, routeBase, callback) {
  var time = faker.date.between(start, end)
  var firstName = faker.name.firstName()
  var lastName = faker.name.lastName()
  var source = this.sources[Math.floor(Math.random() * this.sources.length)]
  var person = {}

  var payloadData = {
    firstName: firstName,
    lastName: lastName,
    email: firstName + '.' + lastName + '@fake.com'
  }

  var payload = {
    source: source,
    createdAt: time.getTime(),
    data: JSON.stringify(payloadData)
  }

  request.post((routeBase + '/api/person'), {form: payload}, function (error, data, response) {
    if (error) { return callback(error) }
    response = JSON.parse(response)
    if (response.error) { error = response.error }
    person = payload
    person.data = payloadData
    person.guid = JSON.parse(data.body).guid
    person.createdAt = new Date(person.createdAt)
    callback(error, person)
  })
}

exports.buildFunnel = function (person, routeBase, callback) {
  var counter = 0
  var ip = faker.internet.ip()
  var progress = true
  var jobs = []

  var payload
  var event

  var pushEvent = function (event, payload) {
    jobs.push(function (next) {
      request.post(routeBase + '/api/event', {form: payload}, function (error, data, response) {
        response = JSON.parse(response)
        if (response.error && !error) { error = data.error }
        next(error, event)
      })
    })
  }

  while (counter < this.funnel.length && progress === true) {
    if (Math.random() <= this.funnel[counter].rate) {
      event = this.funnel[counter].pages[Math.floor(Math.random() * this.funnel[counter].pages.length)]

      payload = {
        createdAt: (new Date(person.createdAt + (1000 * 30 * counter))).getTime(),
        personGuid: person.guid,
        type: 'pageview',
        device: person.source,
        ip: ip,
        data: JSON.stringify({
          page: event
        })
      }

      pushEvent(event, payload)

      if (event === 'thank-you.html') {
        payload = {
          createdAt: (new Date(person.createdAt + (1000 * 30 * counter))).getTime(),
          personGuid: person.guid,
          type: 'purchase',
          ip: ip,
          device: person.source,
          data: JSON.stringify({
            value: Math.round(Math.random() * 1000)
          })
        }

        pushEvent('purchase', payload)
      }
    } else {
      progress = false
    }

    counter++
  }

  async.series(jobs, function (error, events) {
    if (error) { return callback(error) }
    if (!Array.isArray(events)) { events = [events] }
    return callback(error, events)
  })
}
