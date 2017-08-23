const Sequelize = require('sequelize')
const sanitizeHtml = require('sanitize-html')
const mustache = require('mustache')
const async = require('async')
const uuid = require('uuid')

let loader = function (api) {
  /* --- Priave Methods --- */

  let allowedTags = [
    'html', 'body',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre',
    'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em',
    'strike', 'code',
    'hr', 'br', 'div', 'span', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td'
  ]

  let expandDate = function (d) {
    let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    return {
      string: d.toString(),
      date: d.getDate(),
      day: d.getDay(),
      fullYear: d.getFullYear(),
      hours: d.getHours(),
      milisseconds: d.getMilliseconds(),
      minutes: d.getMinutes(),
      monthName: monthNames[d.getMonth()],
      month: (d.getMonth() + 1),
      seconds: d.getSeconds(),
      time: d.getTime(),
      timezoneOffset: d.getTimezoneOffset()
      // UTCDate: d.getUTCDate(),
      // UTCDay: d.getUTCDay(),
      // UTCFullYear: d.getUTCFullYear(),
      // UTCHours: d.getUTCHours(),
      // UTCMilliseconds: d.getUTCMilliseconds(),
      // UTCMinutes: d.getUTCMinutes(),
      // UTCMonth: d.getUTCMonth(),
      // UTCSeconds: d.getUTCSeconds(),
      // year: d.getYear(),
    }
  }

  let buildView = function (team, person, events, campaign, list, template, trackBeacon) {
    let view = {}

    view.campaign = {}
    view.list = {}
    if (campaign) { view.campaign = campaign.apiData() }
    if (list) { view.list = list.apiData() }

    // beacon
    view.beaconLink = team.trackingDomain + '/api/message/track.gif?'
    view.beaconLink += 'verb=read&'
    view.beaconLink += 'guid=%%MESSAGEGUID%%'

    if (trackBeacon === true) {
      view.beacon = '<img src="'
      view.beacon += view.beaconLink
      view.beacon += '" >'
    } else {
      view.beacon = ''
    }

    view.track = function () {
      return function (val, render) {
        let url = ''
        url += team.trackingDomain + '/api/message/track.gif?'
        url += 'verb=act&'
        url += 'guid=%%MESSAGEGUID%%&'
        url += 'link=' + render(val)
        return url
      }
    }

    view.optOutLink = function () {
      return function (val) {
        let page = team.trackingDomain + '/tracking/' + team.guid + '/optOut.html'
        if (val) { page = val }

        let url = ''
        url += page + '?'
        url += 'personGuid=' + person.guid + '&'
        url += 'messageGuid=%%MESSAGEGUID%%&' + '&'
        if (view.campaign.guid) { url += 'campaignGuid=' + view.campaign.guid + '&' }
        if (view.list.guid) { url += 'listGuid=' + view.list.guid + '&' }
        return url
      }
    }

    view.include = function () {
      return function (val, render) {
        return '%%TEMPLATEINCLUDE:' + val + '%%'
      }
    }

    // person
    view.person = Object.assign({}, person.dataValues)
    view.person.data = Object.assign({}, person.data)
    view.person.createdAt = expandDate(view.person.createdAt)
    view.person.updatedAt = expandDate(view.person.updatedAt)
    Object.keys(view.person.data).forEach((k) => {
      if (view.person.data[k] instanceof Date) {
        view.person.data[k] = expandDate(view.person.data[k])
      }
    })

    // events
    view.events = events

    // template
    view.template = template.apiData()
    delete view.template.template
    view.template.createdAt = expandDate(view.template.createdAt)
    view.template.updatedAt = expandDate(view.template.updatedAt)

    // time
    view.now = expandDate(new Date())
    return view
  }

  /* --- Public Model --- */

  return {
    name: 'Template',
    model: api.sequelize.sequelize.define('template',
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
        'template': {
          type: Sequelize.TEXT,
          allowNull: true,
          set: function (q) {
            this.setDataValue('template', sanitizeHtml(q, {
              allowedTags: allowedTags,
              allowedAttributes: false
            }))
          }
        }
      },

      {
        instanceMethods: {

          render: function (person, message, campaign, list, trackBeacon, callback, includedGuids) {
            let template = this
            let jobs = []
            let events = [] // TODO: Do we load in the events?  How many?
            let team
            let view
            let html

            if (!template.template || template.template.length === 0) { return callback(new Error('template empty')) }

            // Recusion saftey!
            if (!includedGuids) { includedGuids = [] }
            if (includedGuids.indexOf(template.guid) >= 0) { return callback(new Error('Cannot include template into itself')) }
            includedGuids.push(template.guid)

            jobs.push((done) => {
              api.models.Team.findOne({where: {guid: template.teamGuid}}).then((t) => {
                team = t
                if (!team) { return done(new Error('team not found')) }
                return done()
              }).catch(done)
            })

            jobs.push((done) => {
              try {
                view = buildView(team, person, events, campaign, list, template, trackBeacon)
                done()
              } catch (e) { done(e) }
            })

            jobs.push((done) => {
              try {
                html = mustache.render(template.template, view)
                if (message) {
                  html = html.replace(/%%MESSAGEGUID%%/g, message.guid)
                  view.beaconLink = view.beaconLink.replace(/%%MESSAGEGUID%%/g, message.guid)
                  view.beacon = view.beacon.replace(/%%MESSAGEGUID%%/g, message.guid)
                }
                done()
              } catch (e) {
                return done(e)
              }
            })

            jobs.push((done) => {
              let includeJobs = []
              let matches = html.match(/%%TEMPLATEINCLUDE:.*%%/g)
              if (!matches || matches.length === 0) { return done() }
              matches.forEach((match) => {
                let matcher = match.replace(/%%/g, '').split(':')[1]
                let includedTemplate

                includeJobs.push((includeDone) => {
                  let or = {name: matcher, guid: matcher}
                  api.models.Template.findOne({where: {
                    teamGuid: team.guid,
                    $or: or
                  }}).then((_includedTemplate) => {
                    if (!_includedTemplate) { return includeDone(new Error('Cannot find template to include (' + matcher + ')')) }
                    includedTemplate = _includedTemplate
                    includeDone()
                  }).catch(includeDone)
                })

                includeJobs.push((includeDone) => {
                  includedTemplate.render(person, message, campaign, list, trackBeacon, (error, includedHtml) => {
                    if (error) { return includeDone(error) }
                    html = html.replace(match, includedHtml)
                    includeDone()
                  }, includedGuids)
                })
              })

              async.series(includeJobs, (error) => {
                return done(error)
              })
            })

            async.series(jobs, (error) => {
              if (error) { return callback(error) }
              let logData = {}
              if (message) { logData = {messageGuid: message.guid} }
              api.log('rendered template #' + template.guid + ' for person #' + person.guid, 'debug', logData)
              return callback(null, html, view)
            })
          },

          apiData: function () {
            return {
              guid: this.guid,

              name: this.name,
              description: this.description,
              folder: this.folder,
              template: this.template,

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
