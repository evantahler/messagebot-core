module.exports = {
  initialize: function (api, next) {
    let redis = api.redis.clients.client

    api.session = {
      prefix: 'session:',
      ttl: 60 * 60 * 24, // 1 day

      load: function (connection, callback) {
        let key = api.session.prefix + connection.fingerprint
        redis.get(key, (error, data) => {
          if (error) {
            return callback(error)
          } else if (data) {
            return callback(null, JSON.parse(data))
          } else {
            return callback(null, false)
          }
        })
      },

      create: function (connection, user, callback) {
        let key = api.session.prefix + connection.fingerprint

        let sessionData = {
          userId: user.id,
          teamId: user.teamId,
          role: user.role,
          sesionCreatedAt: new Date().getTime()
        }

        user.updateAttributes({lastLoginAt: new Date()}).then(() => {
          redis.set(key, JSON.stringify(sessionData), (error, data) => {
            if (error) { return callback(error) }
            redis.expire(key, api.session.ttl, (error) => {
              callback(error, sessionData)
            })
          })
        }).catch(callback)
      },

      destroy: function (connection, callback) {
        let key = api.session.prefix + connection.fingerprint
        redis.del(key, callback)
      },

      middleware: {
        'logged-in-session': {
          name: 'logged-in-session',
          global: false,
          priority: 1000,
          preProcessor: function (data, callback) {
            api.session.load(data.connection, (error, sessionData) => {
              if (error) {
                return callback(error)
              } else if (!sessionData) {
                return callback(new Error('Please log in to continue'))
              } else {
                data.session = sessionData
                let key = api.session.prefix + data.connection.fingerprint
                redis.expire(key, api.session.ttl, callback)
              }
            })
          }
        },

        'role-required-admin': {
          name: 'role-required-admin',
          global: false,
          priority: 9999,
          preProcessor: function (data, callback) {
            if (data.session.role !== 'admin') {
              return callback(new Error('admin role requried'))
            } else {
              return callback()
            }
          }
        }

      }
    }

    api.actions.addMiddleware(api.session.middleware['logged-in-session'])
    api.actions.addMiddleware(api.session.middleware['role-required-admin'])

    next()
  }
}
