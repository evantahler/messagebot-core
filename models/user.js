var Sequelize = require('sequelize')
var bcrypt = require('bcrypt')

var loader = function (api) {
  /* --- Priave Methods --- */

  var bcryptComplexity = 10

  var validRoles = [
    'new',
    'disabled',
    'admin',
    'marketer',
    'analyst',
    'developer',
    'designer'
  ]

  /* --- Public Model --- */

  return {
    name: 'User',
    model: api.sequelize.sequelize.define('user',
      {
        'teamId': {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        'email': {
          type: Sequelize.STRING,
          allowNull: false,
          validate: { isEmail: true }
        },
        'passwordHash': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'personGuid': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'role': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'new',
          validate: {
            validRole: function (value) {
              if (validRoles.indexOf(value) < 0) {
                throw new Error('role is invalid')
              }
            }
          }
        },
        'firstName': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'lastName': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'lastLoginAt': {
          type: Sequelize.DATE,
          allowNull: true
        }
      },

      {
        instanceMethods: {
          name: function () {
            return [this.firstName, this.lastName].join(' ')
          },

          validRoles: function () {
            return validRoles
          },

          updatePassword: function (pw, callback) {
            var self = this
            bcrypt.hash(pw, bcryptComplexity, function (error, hash) {
              if (error) { return callback(error) }
              self.passwordHash = hash
              callback(null, self)
            })
          },

          checkPassword: function (pw, callback) {
            var self = this
            bcrypt.compare(pw, self.passwordHash, callback)
          },

          apiData: function () {
            return {
              id: this.id,
              personGuid: this.personGuid,
              email: this.email,
              role: this.role,
              firstName: this.firstName,
              lastName: this.lastName,
              createdAt: this.createdAt,
              updatedAt: this.updatedAt
            }
          }
        }
      }
    )
  }
}

module.exports = loader
