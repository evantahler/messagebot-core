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

          escape: (k) => {
            k = k.replace(/'/g, '')
            k = k.replace(/"/g, '')
            return k
          },

          associateListPeople: function (callback) {
            var list = this
            var jobs = []
            var wheres = []
            var count = 0

            if (list.type === 'static') {
              jobs.push(function (done) {
                api.models.ListPerson.count({where: {listId: list.id}}).then(function (_count) {
                  count = _count
                  done()
                }).catch(done)
              })
            } else {
              [
                {q: 'personQuery', parentProps: ['source', 'device', 'lat', 'lng']},
                {q: 'eventQuery', parentProps: ['ip', 'device', 'type', 'lat', 'lng']},
                {q: 'messageQuery', parentProps: ['campaignId', 'transport', 'body']}
              ].forEach((collection) => {
                for (var k in this[collection.q]) {
                  this[collection.q][k].forEach((v) => {
                    let matcher = '='
                    if (v.indexOf('!') === 0 && v.indexOf('%') < 0) {
                      matcher = '!='
                      v = v.substr(1)
                    } else if (v.indexOf('!') === 0 && v.indexOf('%') >= 0) {
                      matcher = 'NOT LIKE'
                      v = v.substr(1)
                    } else if (v.indexOf('%') >= 0) {
                      matcher = 'LIKE'
                    }

                    k = list.escape(k)
                    v = list.escape(v)

                    if (collection.q === 'personQuery') {
                      if (collection.parentProps.indexOf(k) >= 0) {
                        wheres.push({ $in: api.sequelize.sequelize.literal(
                          `(select guid from people where people.${k} ${matcher} "${v}")`
                        )})
                      } else {
                        wheres.push({ $in: api.sequelize.sequelize.literal(
                          `(select personGuid from personData where personData.key = "${k}" and personData.value ${matcher} "${v}")`
                        )})
                      }
                    } else if (collection.q === 'eventQuery') {
                      if (collection.parentProps.indexOf(k) >= 0) {
                        wheres.push({ $in: api.sequelize.sequelize.literal(
                          `(select personGuid from events where events.${k} ${matcher} "${v}")`
                        )})
                      } else {
                        wheres.push({ $in: api.sequelize.sequelize.literal(
                          `(select events.personGuid from events join eventData on eventData.eventGuid = events.guid where eventData.key = "${k}" and eventData.value ${matcher} "${v}")`
                        )})
                      }
                    } else if (collection.q === 'messageQuery') {
                      if (collection.parentProps.indexOf(k) >= 0) {
                        wheres.push({ $in: api.sequelize.sequelize.literal(
                          `(select personGuid from messages where messages.${k} ${matcher} "${v}")`
                        )})
                      } else {
                        wheres.push({ $in: api.sequelize.sequelize.literal(
                          `(select messages.personGuid from messages join messageData on messageData.messageGuid = messages.guid where messageData.key = "${k}" and messageData.value ${matcher} "${v}")`
                        )})
                      }
                    }
                  })
                }
              })

              jobs.push(function (done) {
                api.models.ListPerson.destroy({
                  where: {listId: list.id}
                }).then(function () {
                  done()
                }).catch(done)
              })

              jobs.push((done) => {
                let query = {
                  where: {
                    guid: {
                      $and: wheres
                    }
                  }
                }

                api.utils.findInBatches(api.models.Person, query, (person, next) => {
                  count++
                  api.models.ListPerson.create({
                    personGuid: person.guid,
                    teamId: list.teamId,
                    listId: list.id
                  }).then(() => { next() }).catch(done)
                }, done)
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
                if (!error) { api.log(`counted ${count} people in list #${list.id}, ${list.name} (team #${list.teamId})`) }
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
