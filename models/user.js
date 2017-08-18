const Sequelize = require('sequelize')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  let bcryptComplexity = 10

  let validRoles = [
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
        guid: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: () => { return uuid.v4() }
        },
        'teamGuid': {
          type: Sequelize.UUID,
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
          type: Sequelize.UUID,
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
            let self = this
            bcrypt.hash(pw, bcryptComplexity, (error, hash) => {
              if (error) { return callback(error) }
              self.passwordHash = hash
              callback(null, self)
            })
          },

          checkPassword: function (pw, callback) {
            let self = this
            bcrypt.compare(pw, self.passwordHash, callback)
          },

          apiData: function () {
            return {
              guid: this.guid,
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
