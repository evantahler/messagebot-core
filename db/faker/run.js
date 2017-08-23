const async = require('async')
const path = require('path')
const common = require(path.join(__dirname, 'common.js'))
const sleep = parseInt(process.env.SLEEP) || (1000)

const run = function (api) {
  let routeBase = process.env.PUBLIC_URL || 'http://' + api.config.servers.web.bindIP + ':' + api.config.servers.web.port
  let jobs = []
  let person
  let message = ''
  let end = new Date()
  let start = new Date(end.getTime() + 1)

  message += '[' + end.toString() + '] '

  // create the person
  jobs.push((next) => {
    common.buildPerson(start, end, routeBase, (error, _person) => {
      if (error) { throw error }
      person = _person
      message += 'Created `' + person.data.firstName + ' ' + person.data.lastName + '` + ['
      return next()
    })
  })

  // build events
  jobs.push((next) => {
    common.buildFunnel(person, routeBase, (error, events) => {
      if (error) { throw error }
      message += events.join(', ') + ']'
      return next()
    })
  })

  async.series(jobs, (error) => {
    if (error) { throw (error) }
    console.log(message)
    setTimeout(run, sleep, api)
  })
}

if (require.main === module) {
  common.connect((error, api) => {
    if (error) { throw (error) }
    console.log('Running Faker: ' + api.env)
    run(api)
  })
}

exports.run = run
