const ActionheroPrototype = require('actionhero')
const async = require('async')
const request = require('request')
const should = require('should') // eslint-disable-line
process.env.NODE_ENV = 'test' // just to be safe

let specHelper = {
  actionhero: new ActionheroPrototype(),
  api: null,

  doDatabaseBash: function (cmd, callback, silent) {
    let self = this
    let command = ''

    if (self.api.config.sequelize.dialect === 'mysql') {
      command = 'mysql'
      if (self.api.config.sequelize.username) { command += ' -u ' + self.api.config.sequelize.username }
      if (self.api.config.sequelize.password) { command += ' -p' + self.api.config.sequelize.password }
      if (self.api.config.sequelize.host) { command += ' -h ' + self.api.config.sequelize.host }
      if (self.api.config.sequelize.port) { command += ' --port ' + self.api.config.sequelize.port }
      command += ' -e "' + cmd + '"'
    } else if (self.api.config.sequelize.dialect === 'postgres') {
      command = 'psql'
      if (self.api.config.sequelize.username) { command += ' --username=' + self.api.config.sequelize.username }
      if (self.api.config.sequelize.password) { command = ' PGPASSWORD=' + self.api.config.sequelize.password + ' ' + command }
      if (self.api.config.sequelize.host) { command += ' --host=' + self.api.config.sequelize.host }
      if (self.api.config.sequelize.port) { command += ' --port=' + self.api.config.sequelize.port }
      if (self.api.config.sequelize.database) { command += ' --dbname=' + self.api.config.sequelize.database }
      command += ' -c "' + cmd + '"'
    } else {
      return callback(new Error('I do not know how to work with ' + self.api.config.sequelize.dialect))
    }

    self.api.utils.doShell(command, callback, silent)
  },

  createDatabase: function (callback, silent) {
    let self = this
    if (self.api.config.sequelize.dialect === 'postgres') {
      self.api.utils.doShell(['createdb ' + self.api.config.sequelize.database], callback, silent)
    } else {
      self.doDatabaseBash('create database if not exists ' + self.api.config.sequelize.database, callback, silent)
    }
  },

  dropDatabase: function (callback, silent) {
    let self = this

    if (self.api.config.sequelize.dialect === 'postgres') {
      self.api.utils.doShell(['dropdb --if-exists ' + self.api.config.sequelize.database], (error) => {
        if (error && !String(error).match(/NOTICE/)) { return callback(error) }
        return callback()
      }, silent)
    } else if (self.api.config.sequelize.dialect === 'mysql') {
      self.doDatabaseBash('drop database if exists ' + self.api.config.sequelize.database, callback, silent)
    } else {
      return callback(new Error('I do not know how to drop this type of database: ' + self.api.config.sequelize.dialect))
    }
  },

  migrate: function (callback) {
    let self = this
    let jobs = []

    console.log('\r\n----- MIGRATIING TEST DATABASES -----\r\n')

    jobs.push((done) => {
      if (self.api) { return done() }
      self.initialize(done)
    })

    jobs.push((done) => {
      self.createDatabase(done)
    })

    jobs.push((done) => {
      self.api.utils.doShell('NODE_ENV=test npm run migrate', (error) => {
        if (error && !error.toString().match(/graceful-fs/)) {
          done(error)
        } else {
          done()
        }
      })
    })

    jobs.push((done) => {
      console.log('\r\n----- TEST DATABASES MIGRATED -----\r\n')
      done()
    })

    async.series(jobs, callback)
  },

  clear: function (callback) {
    let self = this
    let jobs = []

    console.log('\r\n----- CLEARING TEST DATABASES -----\r\n')

    jobs.push((done) => {
      if (self.api) { return done() }
      self.initialize(done)
    })

    jobs.push((done) => {
      self.dropDatabase(done)
    })

    jobs.push((done) => {
      console.log('\r\n----- TEST DATABASES CLEARED-----\r\n')
      done()
    })

    async.series(jobs, callback)
  },

  truncate: function (table, callback) {
    let self = this
    if (self.api.config.sequelize.dialect === 'postgres') { table = '"' + table + '"' }
    if (self.api.config.sequelize.dialect === 'mysql') { table = '`' + table + '`' }
    self.api.sequelize.sequelize.query('truncate table ' + table).then(() => {
      callback()
    }).catch(callback)
  },

  createTeam: function (callback) {
    let self = this
    let command = ''
    command += ' NODE_ENV=test'
    command += ' ./node_modules/.bin/actionhero messagebot team create'
    command += ' --name TestTeam'
    command += ' --trackingDomainRegexp "^.*$"'
    command += ' --trackingDomain "http://tracking.site.com"'
    command += ' --email "admin@localhost.com"'
    command += ' --password "password"'

    console.log('\r\n----- CREATING TEST TEAM -----\r\n')
    self.api.utils.doShell(command, (error) => {
      if (error) { console.log('error', error); return callback(error) }
      console.log('\r\n----- TEST TEAM CREATED -----\r\n')
      return callback()
    }, false)
  },

  flushRedis: function (callback) {
    let self = this
    self.api.redis.clients.tasks.flushdb(callback)
  },

  initialize: function (callback) {
    let self = this
    self.actionhero.initialize((error, a) => {
      self.api = a
      callback(error)
    })
  },

  start: function (callback) {
    let self = this
    self.actionhero.start((error, a) => {
      self.api = a
      callback(error, self.api)
    })
  },

  stop: function (callback) {
    let self = this
    self.actionhero.stop((error) => {
      callback(error)
    })
  },

  dateCompare: function (a, b) {
    // hack to compare that dates are within 24h of eachother
    if (!b) { b = new Date() }
    let diff = Math.abs(a.getTime() - b.getTime())
    return diff < (1000 * 60 * 60 * 24)
  },

  login: function (connection, email, password, callback) {
    let self = this
    connection.params = {
      email: email,
      password: password
    }

    self.api.specHelper.runAction('session:create', connection, callback)
  },

  requestWithLogin: function (email, password, action, params, callback) {
    let self = this
    let connection = new self.api.specHelper.Connection()
    self.login(connection, email, password, (loginResponse) => {
      if (loginResponse.error) { return callback(loginResponse) }
      connection.params = params
      self.api.specHelper.runAction(action, connection, callback)
    })
  },

  WebRequestWithLogin: function (email, password, verb, route, params, callback) {
    let self = this
    let j = request.jar()
    let baseUrl = 'http://' + self.api.config.servers.web.bindIP + ':' + self.api.config.servers.web.port
    request.post({
      url: baseUrl + '/api/session',
      jar: j,
      form: {email: email, password: password}
    }, (error, response, body) => {
      if (error) { return callback({error: error}) } //eslint-disable-line
      body = JSON.parse(body)
      if (body.error) { return callback(body) }

      let actionUrl = baseUrl + route + '?'
      if (verb === 'get') {
        for (let key in params) { actionUrl += key + '=' + params[key] + '&' }
      }

      request[verb]({
        url: actionUrl,
        jar: j,
        form: params
      }, (error, response, body) => {
        if (error) { return callback({error: error}) } //eslint-disable-line
        try {
          body = JSON.parse(body)
        } catch (e) { }
        return callback(body, response)
      })
    })
  }
}

/* --- Init the server --- */
before((done) => {
  specHelper.initialize(done)
})

/* --- Always Clear and Migrate before eacn run --- */

if (!process.env.SKIP_MIGRATE || process.env.SKIP_MIGRATE.toString() !== 'true') {
  console.log('You can set SKIP_MIGRATE=true to skip the migration preperation steps of this test suite')
  before(function (done) {
    this.timeout(10 * 1000)
    specHelper.clear(done)
  })

  before(function (done) {
    this.timeout(10 * 1000)
    specHelper.migrate(done)
  })

  before(function (done) {
    this.timeout(10 * 1000)
    specHelper.createTeam(done)
  })

  before((done) => {
    specHelper.flushRedis(done)
  })
}

/* --- Start up the server --- */
before((done) => {
  specHelper.start(done)
})

/* --- Stop the server --- */
after((done) => {
  specHelper.stop(done)
})

module.exports = specHelper
