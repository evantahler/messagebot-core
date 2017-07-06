var Sequelize = require('sequelize')
var async = require('async')

var loader = function (api) {
  /* --- Private Methods --- */

  var reloadCampaigns = function () {
    api.redis.doCluster('api.campaigns.loadTriggered', null, null, function (error) {
      if (error) { throw (error) }
    })
  }

  var validTypes = ['simple', 'recurring', 'trigger']

  var sendSimple = function (campaign, list, callback) {
    if (campaign.sentAt) { return callback(new Error('campaign already sent')) }
    if (campaign.sendAt - new Date().getTime() >= 0) { return callback(new Error('campaign should not be sent yet')) }

    api.utils.findInBatches(api.models.ListPerson, {where: {listId: list.id}}, function (listPerson, done) {
      api.tasks.enqueue('campaigns:sendMessage', {
        listId: list.id,
        campaignId: campaign.id,
        personGuid: listPerson.personGuid
      }, 'messagebot:campaigns', done)
    }, callback)
  }

  var sendRecurring = function (campaign, list, callback) {
    var lastSendAt = (campaign.sentAt ? campaign.sentAt.getTime() : 0)
    if ((lastSendAt + (1000 * campaign.reSendDelay)) - new Date().getTime() >= 0) {
      return callback(new Error('campaign should not be sent yet'))
    }

    api.utils.findInBatches(api.models.ListPerson, {where: {listId: list.id}}, function (listPerson, done) {
      api.tasks.enqueue('campaigns:sendMessage', {
        listId: list.id,
        campaignId: campaign.id,
        personGuid: listPerson.personGuid
      }, 'messagebot:campaigns', done)
    }, callback)
  }

  var sendTrigger = function (campaign, list, callback) {
    callback(new Error('Triggered Campaigns are not sent via this method'))
  }

  /* --- Public Model --- */

  return {
    name: 'Campaign',
    model: api.sequelize.sequelize.define('campaign',
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
        'folder': {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'default'
        },
        'transport': {
          type: Sequelize.STRING,
          allowNull: false
        },
        'listId': {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        'templateId': {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        'campaignVariables': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            var q = this.getDataValue('campaignVariables')
            if (q && q.length > 0) {
              return JSON.parse(q)
            } else {
              return {}
            }
          },
          set: function (q) {
            if (q && typeof q !== 'string') {
              q = JSON.stringify(q)
            }
            this.setDataValue('campaignVariables', q)
          }
        },
        'triggerEventMatch': {
          type: Sequelize.TEXT,
          allowNull: true,
          get: function () {
            var q = this.getDataValue('triggerEventMatch')
            if (q && q.length > 0) {
              return JSON.parse(q)
            } else {
              return {}
            }
          },
          set: function (q) {
            if (q && typeof q !== 'string') {
              q = JSON.stringify(q)
            }
            this.setDataValue('triggerEventMatch', q)
          }
        },
        'sendAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'sendingAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'sentAt': {
          type: Sequelize.DATE,
          allowNull: true
        },
        'triggerDelay': {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        'reSendDelay': {
          type: Sequelize.INTEGER,
          allowNull: true
        }

      },

      {
        hooks: {
          afterCreate: function () { reloadCampaigns() },
          afterUpdate: function () { reloadCampaigns() },
          afterSave: function () { reloadCampaigns() },
          afterUpsert: function () { reloadCampaigns() },
          beforeDestroy: function (self) {
            return new Promise((resolve, reject) => {
              api.models.Message.destroy({where: {campaignId: self.id}}).then(() => {
                reloadCampaigns()
                resolve()
              }).catch(reject)
            })
          }
        },

        instanceMethods: {
          validTypes: function () {
            return validTypes
          },

          stats: function (start, end, interval, callback) {
            var campaign = this
            var jobs = []
            var terms = {sentAt: [], readAt: [], actedAt: []}
            var totals = {sentAt: 0, readAt: 0, actedAt: 0}

            var team = api.utils.determineActionsTeam({params: {teamId: campaign.teamId}})

            Object.keys(totals).forEach(function (term) {
              jobs.push(function (done) {
                var where = {
                  teamId: team.id,
                  campaignId: campaign.id,
                  createdAt: { $lte: end, $gte: start }
                }
                where[term] = { $not: null }
                api.models.Message.findAll({
                  attributes: [
                    [`${interval}(createdAt)`, 'DATE'],
                    'transport',
                    [api.sequelize.sequelize.fn('count', api.sequelize.sequelize.col('guid')), 'TOTAL']
                  ],
                  where: where,
                  group: [api.sequelize.sequelize.literal(`${interval}(createdAt)`), 'transport']
                }).then((rows) => {
                  rows.forEach((row) => {
                    totals[term] = totals[term] + row.dataValues.TOTAL
                    var d = {}
                    d[row.dataValues.DATE] = {}
                    d[row.dataValues.DATE][row.dataValues.transport] = row.dataValues.TOTAL
                    terms[term].push(d)
                  })
                  done()
                }).catch(done)
              })
            })

            async.series(jobs, function (error) {
              callback(error, terms, totals)
            })
          },

          send: function (callback) {
            var campaign = this
            var jobs = []
            var list

            jobs.push(function (done) {
              campaign.getList().then(function (l) {
                list = l
                if (!list) { return done(new Error('list not found')) }
                done()
              }).catch(done)
            })

            jobs.push(function (done) {
              campaign.updateAttributes({
                sendingAt: new Date()
              }).then(function () {
                return done()
              }).catch(done)
            })

            jobs.push(function (done) {
              list.associateListPeople(done)
            })

            jobs.push(function (done) {
              if (campaign.type === 'simple') {
                sendSimple(campaign, list, done)
              } else if (campaign.type === 'recurring') {
                sendRecurring(campaign, list, done)
              } else if (campaign.type === 'trigger') {
                sendTrigger(campaign, list, done)
              } else {
                return done(new Error('campaign type not understood'))
              }
            })

            jobs.push(function (done) {
              campaign.updateAttributes({
                sentAt: new Date()
              }).then(function () {
                return done()
              }).catch(done)
            })

            async.series(jobs, callback)
          },

          apiData: function () {
            return {
              id: this.id,
              name: this.name,
              description: this.description,
              type: this.type,
              folder: this.folder,

              transport: this.transport,
              listId: this.listId,
              templateId: this.templateId,
              campaignVariables: this.campaignVariables,
              triggerEventMatch: this.triggerEventMatch,

              sendAt: this.sendAt,
              sendingAt: this.sendingAt,
              sentAt: this.sentAt,
              triggerDelay: this.triggerDelay,
              reSendDelay: this.reSendDelay,

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
