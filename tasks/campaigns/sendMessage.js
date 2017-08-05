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
      api.models.Person.findOne({where: {
        guid: listPerson.personGuid,
        teamId: team.id
      }}).then((_person) => {
        person = _person
        if (!person) { return done(new Error(`Person (${listPerson.personGuid}) not found`)) }
        person.hydrate(done)
      }).catch(done)
    })

    jobs.push(function (done) {
      message = api.models.Message.build({})
      message.data = {}
      done()
    })

    jobs.push(function (done) {
      api.models.Template.find({where: {id: campaign.templateId}}).then(function (template) {
        template.render(person, message, campaign, list, true, function (error, _body, _view) {
          if (error) { return done(error) }
          body = _body
          done()
        })
      }).catch(done)
    })

    jobs.push(function (done) {
      var missingType
      var missingKey

      api.transports.forEach(function (t) {
        if (t.name === campaign.transport) { transport = t }
      })

      if (!transport) { return done(new Error('transport not found')) }

      transport.requiredDataKeys.person.forEach(function (k) {
        if (!person.data[k]) {
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

      message.teamId = team.id
      message.personGuid = person.guid
      message.transport = transport.name
      message.campaignId = campaign.id
      message.body = body
      message.sentAt = new Date()

      message.save().then(() => {
        done()
      }).catch(done)
    })

    jobs.push(function (done) {
      var toSend = true
      if (api.env === 'test') {
        api.log('not sending messages when NODE_ENV=test')
        toSend = false
      }

      if (toSend && person.globalOptOut === true) {
        api.log(`person #${person.guid} is globally opted-out`)
        toSend = false
      }

      if (toSend && person.listOptOuts.indexOf(list.id) >= 0) {
        api.log(`person #${person.guid} is opted-out of this list (#${list.id})`)
        toSend = false
      }

      if (toSend === true) {
        var sendParams = {body: body}
        transport.campaignVariables.forEach(function (v) {
          sendParams[v] = campaign.campaignVariables[v]
        })

        transport.deliver(sendParams, person, done)
      } else {
        return done()
      }
    })

    async.series(jobs, (error) => { next(error) })
  }
}
