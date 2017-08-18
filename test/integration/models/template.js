const should = require('should')
const async = require('async')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../../specHelper'))
let api

describe('integartion:template', () => {
  describe('#render', () => {
    let person
    let message
    let template
    let footerTemplate

    before(() => { api = specHelper.api })

    before((done) => {
      template = api.models.Template.build({
        teamGuid: 1,
        name: 'my template',
        description: 'my template',
        folder: 'default',
        template: 'Hello there, {{ person.data.firstName }}'
      })

      template.save().then(() => { done() }).catch(done)
    })

    before((done) => {
      footerTemplate = api.models.Template.build({
        teamGuid: 1,
        name: 'my footer',
        description: 'my footer',
        folder: 'default',
        template: '| ©{{ now.fullYear }}'
      })

      footerTemplate.save().then(() => { done() }).catch(done)
    })

    before((done) => {
      person = api.models.Person.build({
        teamGuid: 1,
        source: 'tester',
        device: 'phone',
        listOptOuts: [],
        globalOptOut: false
      })

      person.data = {
        firstName: 'fname',
        lastName: 'lame',
        email: 'fake@faker.fake'
      }

      person.save().then(() => { done() }).catch(done)
    })

    before((done) => {
      message = api.models.Message.build({
        teamGuid: 1,
        personGuid: person.guid,
        transport: 'smtp',
        campaignGuid: '1',
        body: '',
        view: {},
        sentAt: new Date()
      })

      message.save().then(() => { done() }).catch(done)
    })

    before((done) => { person.hydrate(done) })

    after((done) => { person.destroy().then(() => { done() }) })
    after((done) => { message.destroy().then(() => { done() }) })
    after((done) => { footerTemplate.destroy().then(() => { done() }) })
    after((done) => { template.destroy().then(() => { done() }) })

    it('renders a template (happy, no message)', (done) => {
      template.render(person, null, null, null, true, (error, html, view) => {
        should.not.exist(error)
        html.should.equal('Hello there, fname')
        view.person.data.firstName.should.equal('fname')
        view.template.id.should.equal(template.id)
        view.beaconLink.should.equal('http://tracking.site.com/api/message/track.gif?verb=read&guid=%%MESSAGEGUID%%')
        view.beacon.should.equal('<img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=%%MESSAGEGUID%%" >')
        done()
      })
    })

    it('renders a template (happy, with message)', (done) => {
      template.render(person, message, null, null, true, (error, html, view) => {
        should.not.exist(error)
        html.should.equal('Hello there, fname')
        view.person.data.firstName.should.equal('fname')
        view.template.id.should.equal(template.id)
        view.beaconLink.should.equal('http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid)
        view.beacon.should.equal('<img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid + '" >')
        done()
      })
    })

    it('expands beacons properly', (done) => {
      template.template = 'Hello there, {{ person.data.firstName }} {{{ beacon }}}'
      template.render(person, message, null, null, true, (error, html, view) => {
        should.not.exist(error)
        html.should.equal('Hello there, fname <img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid + '" >')
        view.beaconLink.should.equal('http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid)
        view.beacon.should.equal('<img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid + '" >')
        done()
      })
    })

    it('expands dates properly', (done) => {
      let now = new Date()
      let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      let month = monthNames[now.getMonth()]

      template.template = 'Hello there, {{ person.data.firstName }} @ {{person.updatedAt.monthName}}'
      template.render(person, message, null, null, null, (error, html, view) => {
        should.not.exist(error)
        html.should.equal('Hello there, fname @ ' + month)
        done()
      })
    })

    it('removes bad HTML entities', (done) => {
      template.template = 'ABC<script>alert("boom");</script>XYZ'
      template.render(person, message, null, null, null, (error, html, view) => {
        should.not.exist(error)
        html.should.equal('ABCXYZ')
        done()
      })
    })

    it('tracks links properly', (done) => {
      template.template = 'Hello there, <a href="{{#track}}http://messagebot.io{{/track}}">click me</a>'
      template.render(person, message, null, null, null, (error, html, view) => {
        should.not.exist(error)
        html.should.equal('Hello there, <a href="http://tracking.site.com/api/message/track.gif?verb=act&guid=' + message.guid + '&link=http://messagebot.io">click me</a>')
        done()
      })
    })

    describe('includes sub-templates', (done) => {
      let year = new Date().getFullYear()

      it('(happy, by id)', (done) => {
        let jobs = []

        jobs.push((next) => {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}my footer{{/include}}'
          }).then(() => {
            next()
          }).catch(next)
        })

        jobs.push((next) => {
          template.render(person, null, null, null, null, (error, html, view) => {
            should.not.exist(error)
            html.should.equal('Hello there, fname | ©' + year)
            next()
          })
        })

        async.series(jobs, done)
      })

      it('(happy, by name)', (done) => {
        let jobs = []

        jobs.push((next) => {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}' + footerTemplate.id + '{{/include}}'
          }).then(() => {
            next()
          }).catch(next)
        })

        jobs.push((next) => {
          template.render(person, null, null, null, null, (error, html, view) => {
            should.not.exist(error)
            html.should.equal('Hello there, fname | ©' + year)
            next()
          })
        })

        async.series(jobs, done)
      })

      it('(failure; missing)', (done) => {
        let jobs = []

        jobs.push((next) => {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}MISSING THING{{/include}}'
          }).then(() => {
            next()
          }).catch(next)
        })

        jobs.push((next) => {
          template.render(person, null, null, null, null, (error, html, view) => {
            error.toString().should.equal('Error: Cannot find template to include (MISSING THING)')
            next()
          })
        })

        async.series(jobs, done)
      })

      it('(failure; self-include)', (done) => {
        let jobs = []

        jobs.push((next) => {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}' + template.id + '{{/include}}'
          }).then(() => {
            next()
          }).catch(next)
        })

        jobs.push((next) => {
          template.render(person, null, null, null, null, (error, html, view) => {
            error.toString().should.equal('Error: Cannot include template into itself')
            next()
          })
        })

        async.series(jobs, done)
      })
    })
  })
})
