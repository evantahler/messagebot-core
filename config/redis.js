let host = process.env.REDIS_HOST || '127.0.0.1'
let port = process.env.REDIS_PORT || 6379
let db = process.env.REDIS_DB || 0
let password = process.env.REDIS_PASSWORD || null

if (process.env.REDIS_URL) {
  password = process.env.REDIS_URL.match(/redis:\/\/.*:(.*)@.*:\d*$/i)[1]
  host = process.env.REDIS_URL.match(/redis:\/\/.*:.*@(.*):\d*$/i)[1]
  port = parseInt(process.env.REDIS_URL.match(/redis:\/\/.*:.*@.*:(\d*)$/i)[1])
}

const maxBackoff = 1000

exports['default'] = {
  redis: function (api) {
    // konstructor: The redis client constructor method
    // args: The arguments to pass to the constructor
    // buildNew: is it `new konstructor()` or just `konstructor()`?

    function retryStrategy (times) {
      if (times === 1) {
        api.log('Unable to connect to Redis - please check your Redis config!', 'error')
        return 5000
      }
      return Math.min(times * 50, maxBackoff)
    }

    if (process.env.FAKEREDIS === 'false' || process.env.REDIS_HOST !== undefined) {
      return {
        '_toExpand': false,
        client: {
          konstructor: require('ioredis'),
          args: [{ port: port, host: host, password: password, db: db, retryStrategy: retryStrategy }],
          buildNew: true
        },
        subscriber: {
          konstructor: require('ioredis'),
          args: [{ port: port, host: host, password: password, db: db, retryStrategy: retryStrategy }],
          buildNew: true
        },
        tasks: {
          konstructor: require('ioredis'),
          args: [{ port: port, host: host, password: password, db: db, retryStrategy: retryStrategy }],
          buildNew: true
        }
      }
    } else {
      return {
        '_toExpand': false,
        client: {
          konstructor: require('fakeredis').createClient,
          args: [port, host, {fast: true}],
          buildNew: false
        },
        subscriber: {
          konstructor: require('fakeredis').createClient,
          args: [port, host, {fast: true}],
          buildNew: false
        },
        tasks: {
          konstructor: require('fakeredis').createClient,
          args: [port, host, {fast: true}],
          buildNew: false
        }
      }
    }
  }
}
