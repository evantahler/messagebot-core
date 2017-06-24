'use strict'

var async = require('async')

exports.task = {
  name: 'campaigns:sendMessage',
  description: 'campaigns:sendMessage',
  frequency: 0,
  queue: 'messagebot:campaigns',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    var jobs = []
    var campaign
    var list
    var listPerson
    var person
    var body
    var transport
    var message
    var team

    jobs.push(function (done) {
      api.models.Campaign.findOne({where: {id: params.campaignId}}).then(function (c) {
        campaign = c
        if (!campaign) { return done(new Error('campaign not found')) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      api.models.List.findOne({where: {id: params.listId}}).then(function (l) {
        list = l
        if (!list) { return done(new Error('list not found')) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      api.models.ListPerson.findOne({where: {
        personGuid: params.personGuid,
        listId: list.id
      }}).then(function (lp) {
        listPerson = lp
        if (!listPerson) { return done(new Error('listPerson not found')) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      api.models.Team.findOne({where: {id: campaign.teamId}}).then(function (t) {
        team = t
        if (!team) { return done(new Error('team not found')) }
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      message = new api.models.Message(team)
      message.ensureGuid()
      done()
    })

    jobs.push(function (done) {
      person = new api.models.Person(team, listPerson.personGuid)
      person.hydrate(function (error) {
        if (error) { return done(error) }
        done()
      })
    })

    jobs.push(function (done) {
      api.models.Template.find({where: {id: campaign.templateId}}).then(function (template) {
        template.render(person, message, campaign, list, true, function (error, _body, _view) {
          if (error) { return done(error) }
          body = _body
          done()
        })
      })
    })

    jobs.push(function (done) {
      var missingType
      var missingKey

      api.transports.forEach(function (t) {
        if (t.name === campaign.transport) { transport = t }
      })

      if (!transport) { return done(new Error('transport not found')) }

      transport.requiredDataKeys.person.forEach(function (k) {
        if (!person.data.data[k]) {
          missingType = 'person'
          missingKey = k
        }
      })

      // TODO: Event validation

      if (missingKey) { return done(new Error(missingType + ' missing data.' + missingKey)) }

      done()
    })

    jobs.push(function (done) {
      Object.keys(campaign.campaignVariables).forEach(function (k) {
        message.data[k] = campaign.campaignVariables[k]
      })

      message.data.personGuid = person.guid
      message.data.transport = transport.name
      message.data.campaignId = campaign.id
      message.data.body = body
      message.data.sentAt = new Date()

      message.create(done)
    })

    jobs.push(function (done) {
      var toSend = true
      if (api.env === 'test') {
        api.log('not sending messages when NODE_ENV=test')
        toSend = false
      }

      if (toSend && person.data.globalOptOut === true) {
        api.log(['person #%s is globally opted-out', person.guid])
        toSend = false
      }

      if (toSend && person.data.listOptOuts.indexOf(list.id) >= 0) {
        api.log(['person #%s is opted-out of this list (#%s)', person.guid, list.id])
        toSend = false
      }

      if (toSend === true) {
        var sendParams = {body: body}
        transport.campaignVariables.forEach(function (v) {
          sendParams[v] = campaign.campaignVariables[v]
        })

        transport.deliver(sendParams, person, done)
      } else {
        done()
      }
    })

    async.series(jobs, function (error) {
      process.nextTick(function () { return next(error) })
    })
  }
}
