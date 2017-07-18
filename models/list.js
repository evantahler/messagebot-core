var Sequelize = require('sequelize')
var async = require('async')

var loader = function (api) {
  /* --- Priave Methods --- */

  var validTypes = ['dynamic', 'static']

  /* --- Public Model --- */

  return {
    name: 'List',
    model: api.sequelize.sequelize.define('list',
      {
        'teamId': {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        'name': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'description': {
          type: Sequelize.TEXT,
          allowNull: false
        },
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default'
        },
        'type': {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            validTypes: function (value) {
              if (validTypes.indexOf(value) < 0) {
                throw new Error('type is invalid')
              }
            }
          }
        },
        'personQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            var q = this.getDataValue('personQuery')
            if (q && q.length > 0) {
              return JSON.parse(q)
            } else {
              return q
            }
          },
          set: function (q) {
            if (q && typeof q !== 'string') {
              q = JSON.stringify(q)
            }
            this.setDataValue('personQuery', q)
          }
        },
        'eventQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            var q = this.getDataValue('eventQuery')
            if (q && q.length > 0) {
              return JSON.parse(q)
            } else {
              return q
            }
          },
          set: function (q) {
            if (q && typeof q !== 'string') {
              q = JSON.stringify(q)
            }
            this.setDataValue('eventQuery', q)
          }
        },
        'messageQuery': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            var q = this.getDataValue('messageQuery')
            if (q && q.length > 0) {
              return JSON.parse(q)
            } else {
              return q
            }
          },
          set: function (q) {
            if (q && typeof q !== 'string') {
              q = JSON.stringify(q)
            }
            this.setDataValue('messageQuery', q)
          }
        },

        'peopleCount': {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0
        },
        'peopleCountedAt': {
          type: Sequelize.DATE,
          allowNull: true
        }
      },

      {
        instanceMethods: {
          validTypes: function () {
            return validTypes
          },

          associateListPeople: function (callback) {
            var list = this
            var jobs = []
            var people = []
            var wheres = []
            var count

            // TODO: This is going to crash the node with large listPerson
            // TODO: This is slow.

            if (list.type === 'static') {
              jobs.push(function (done) {
                api.models.ListPerson.count({where: {listId: list.id}}).then(function (_count) {
                  count = _count
                  done()
                }).catch(done)
              })
            } else {
              [
                {q: 'personQuery', guidKey: 'personGuid', table: 'personData'}
                // {q: 'eventQuery', set: 'events', model: 'EventData'},
                // {q: 'messageQuery', set: 'messages', model: 'MessageData'}
              ].forEach((collection) => {
                for (var k in this[collection.q]) {
                  this[collection.q][k].forEach((v) => {
                    wheres.push({ $in: api.sequelize.sequelize.literal(`(select ${collection.guidKey} from ${collection.table} where \`key\` = "${k}" and \`value\` LIKE "${v}")`) })
                  })
                }
              })

              jobs.push((done) => {
                // TODO: find in batches

                api.models.Person.findAll({
                  where: {
                    guid: {
                      $and: wheres
                    }
                  }
                }).then((_people) => {
                  people = _people
                  count = people.length
                  done()
                }).catch(done)
              })

              jobs.push(function (done) {
                api.models.ListPerson.destroy({
                  where: {listId: list.id}
                }).then(function () {
                  done()
                }).catch(done)
              })

              jobs.push(function (done) {
                var bulk = []

                people.forEach(function (person) {
                  bulk.push({
                    personGuid: person.guid,
                    teamId: list.teamId,
                    listId: list.id
                  })
                })

                api.models.ListPerson.bulkCreate(bulk, {validate: true}).then(function () {
                  done()
                }).catch(done)
              })
            }

            jobs.push(function (done) {
              list.updateAttributes({
                peopleCount: count,
                peopleCountedAt: (new Date())
              }).then(function () {
                done()
              }).catch(done)
            })

            async.series(jobs, function (error) {
              process.nextTick(function () {
                if (!error) { api.log(['counted %s people in list #%s, %s (team #%s)', count, list.id, list.name, list.teamId]) }
                callback(error, count)
              })
            })
          },

          apiData: function () {
            return {
              id: this.id,
              name: this.name,
              description: this.description,
              folder: this.folder,
              type: this.type,

              personQuery: this.personQuery,
              eventQuery: this.eventQuery,
              messageQuery: this.messageQuery,

              peopleCount: this.peopleCount,
              peopleCountedAt: this.peopleCountedAt,

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
