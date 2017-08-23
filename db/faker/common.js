const faker = require('faker')
const request = require('request')
const async = require('async')
const path = require('path')
const ActionHeroPrototype = require(path.join(__dirname, '/../../node_modules/actionhero/actionhero.js'))

exports.connect = function (callback) {
  let actionhero = new ActionHeroPrototype()
  let configChanges = {
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
  let time = faker.date.between(start, end)
  let firstName = faker.name.firstName()
  let lastName = faker.name.lastName()
  let source = this.sources[Math.floor(Math.random() * this.sources.length)]
  let person = {}

  let payloadData = {
    firstName: firstName,
    lastName: lastName,
    email: firstName + '.' + lastName + '@fake.com'
  }

  let payload = {
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
    person.guid = JSON.parse(data.body).person.guid
    person.createdAt = new Date(person.createdAt)
    callback(error, person)
  })
}

exports.buildFunnel = function (person, routeBase, callback) {
  let counter = 0
  let ip = faker.internet.ip()
  let progress = true
  let jobs = []

  let payload
  let event

  let pushEvent = function (event, payload) {
    jobs.push((next) => {
      request.post(routeBase + '/api/event', {form: payload}, (error, data, response) => {
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

  async.series(jobs, (error, events) => {
    if (error) { return callback(error) }
    if (!Array.isArray(events)) { events = [events] }
    return callback(error, events)
  })
}
