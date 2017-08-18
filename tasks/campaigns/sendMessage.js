const async = require('async')

exports.task = {
  name: 'campaigns:sendMessage',
  description: 'campaigns:sendMessage',
  frequency: 0,
  queue: 'messagebot:campaigns',
  plugins: [],
  pluginOptions: {},

  run: function (api, params, next) {
    let jobs = []
    let campaign
    let list
    let listPerson
    let person
    let body
    let transport
    let message
    let team

    jobs.push((done) => {
      api.models.Campaign.findOne({where: {guid: params.campaignGuid}}).then((c) => {
        campaign = c
        if (!campaign) { return done(new Error('campaign not found')) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.List.findOne({where: {guid: params.listGuid}}).then((l) => {
        list = l
        if (!list) { return done(new Error('list not found')) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.ListPerson.findOne({where: {
        personGuid: params.personGuid,
        listGuid: list.id
      }}).then((lp) => {
        listPerson = lp
        if (!listPerson) { return done(new Error('listPerson not found')) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.Team.findOne({where: {guid: campaign.teamGuid}}).then((t) => {
        team = t
        if (!team) { return done(new Error('team not found')) }
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      api.models.Person.findOne({where: {
        guid: listPerson.personGuid,
        teamGuid: team.guid
      }}).then((_person) => {
        person = _person
        if (!person) { return done(new Error(`Person (${listPerson.personGuid}) not found`)) }
        person.hydrate(done)
      }).catch(done)
    })

    jobs.push((done) => {
      message = api.models.Message.build({})
      message.data = {}
      done()
    })

    jobs.push((done) => {
      api.models.Template.find({where: {guid: campaign.templateGuid}}).then((template) => {
        template.render(person, message, campaign, list, true, (error, _body, _view) => {
          if (error) { return done(error) }
          body = _body
          done()
        })
      }).catch(done)
    })

    jobs.push((done) => {
      let missingType
      let missingKey

      api.transports.forEach((t) => {
        if (t.name === campaign.transport) { transport = t }
      })

      if (!transport) { return done(new Error('transport not found')) }

      transport.requiredDataKeys.person.forEach((k) => {
        if (!person.data[k]) {
          missingType = 'person'
          missingKey = k
        }
      })

      // TODO: Event validation

      if (missingKey) { return done(new Error(missingType + ' missing data.' + missingKey)) }

      done()
    })

    jobs.push((done) => {
      Object.keys(campaign.campaignVariables).forEach((k) => {
        message.data[k] = campaign.campaignVariables[k]
      })

      message.teamGuid = team.guid
      message.personGuid = person.guid
      message.transport = transport.name
      message.campaignGuid = campaign.guid
      message.body = body
      message.sentAt = new Date()

      message.save().then(() => {
        done()
      }).catch(done)
    })

    jobs.push((done) => {
      let toSend = true
      if (api.env === 'test') {
        api.log('not sending messages when NODE_ENV=test')
        toSend = false
      }

      if (toSend && person.globalOptOut === true) {
        api.log(`person #${person.guid} is globally opted-out`)
        toSend = false
      }

      if (toSend && person.listOptOuts.indexOf(list.id) >= 0) {
        api.log(`person #${person.guid} is opted-out of this list (#${list.guid})`)
        toSend = false
      }

      if (toSend === true) {
        let sendParams = {body: body}
        transport.campaignVariables.forEach((v) => {
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
