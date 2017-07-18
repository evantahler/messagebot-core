var should = require('should')
var async = require('async')
var path = require('path')
var specHelper = require(path.join(__dirname, '/../../specHelper'))
var api

describe('integartion:template', function () {
  describe('#render', function () {
    var person
    var message
    var template
    var footerTemplate

    before(function () { api = specHelper.api })

    before(function (done) {
      template = api.models.Template.build({
        teamId: 1,
        name: 'my template',
        description: 'my template',
        folder: 'default',
        template: 'Hello there, {{ person.data.firstName }}'
      })

      template.save().then(function () { done() }).catch(done)
    })

    before(function (done) {
      footerTemplate = api.models.Template.build({
        teamId: 1,
        name: 'my footer',
        description: 'my footer',
        folder: 'default',
        template: '| ©{{ now.fullYear }}'
      })

      footerTemplate.save().then(function () { done() }).catch(done)
    })

    before(function (done) {
      person = api.models.Person.build({
        teamId: 1,
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

    before(function (done) {
      message = api.models.Message.build({
        teamId: 1,
        personGuid: person.guid,
        transport: 'smtp',
        campaignId: '1',
        body: '',
        view: {},
        sentAt: new Date()
      })

      message.save().then(() => { done() }).catch(done)
    })

    before(function (done) { person.hydrate(done) })

    after(function (done) { person.destroy().then(() => { done() }) })
    after(function (done) { message.destroy().then(() => { done() }) })
    after(function (done) { footerTemplate.destroy().then(function () { done() }) })
    after(function (done) { template.destroy().then(function () { done() }) })

    it('renders a template (happy, no message)', function (done) {
      template.render(person, null, null, null, true, function (error, html, view) {
        should.not.exist(error)
        html.should.equal('Hello there, fname')
        view.person.data.firstName.should.equal('fname')
        view.template.id.should.equal(template.id)
        view.beaconLink.should.equal('http://tracking.site.com/api/message/track.gif?verb=read&guid=%%MESSAGEGUID%%')
        view.beacon.should.equal('<img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=%%MESSAGEGUID%%" >')
        done()
      })
    })

    it('renders a template (happy, with message)', function (done) {
      template.render(person, message, null, null, true, function (error, html, view) {
        should.not.exist(error)
        html.should.equal('Hello there, fname')
        view.person.data.firstName.should.equal('fname')
        view.template.id.should.equal(template.id)
        view.beaconLink.should.equal('http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid)
        view.beacon.should.equal('<img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid + '" >')
        done()
      })
    })

    it('expands beacons properly', function (done) {
      template.template = 'Hello there, {{ person.data.firstName }} {{{ beacon }}}'
      template.render(person, message, null, null, true, function (error, html, view) {
        should.not.exist(error)
        html.should.equal('Hello there, fname <img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid + '" >')
        view.beaconLink.should.equal('http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid)
        view.beacon.should.equal('<img src="http://tracking.site.com/api/message/track.gif?verb=read&guid=' + message.guid + '" >')
        done()
      })
    })

    it('expands dates properly', function (done) {
      var now = new Date()
      var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      var month = monthNames[now.getMonth()]

      template.template = 'Hello there, {{ person.data.firstName }} @ {{person.updatedAt.monthName}}'
      template.render(person, message, null, null, null, function (error, html, view) {
        should.not.exist(error)
        html.should.equal('Hello there, fname @ ' + month)
        done()
      })
    })

    it('removes bad HTML entities', function (done) {
      template.template = 'ABC<script>alert("boom");</script>XYZ'
      template.render(person, message, null, null, null, function (error, html, view) {
        should.not.exist(error)
        html.should.equal('ABCXYZ')
        done()
      })
    })

    it('tracks links properly', function (done) {
      template.template = 'Hello there, <a href="{{#track}}http://messagebot.io{{/track}}">click me</a>'
      template.render(person, message, null, null, null, function (error, html, view) {
        should.not.exist(error)
        html.should.equal('Hello there, <a href="http://tracking.site.com/api/message/track.gif?verb=act&guid=' + message.guid + '&link=http://messagebot.io">click me</a>')
        done()
      })
    })

    describe('includes sub-templates', function (done) {
      var year = new Date().getFullYear()

      it('(happy, by id)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}my footer{{/include}}'
          }).then(function () {
            next()
          }).catch(next)
        })

        jobs.push(function (next) {
          template.render(person, null, null, null, null, function (error, html, view) {
            should.not.exist(error)
            html.should.equal('Hello there, fname | ©' + year)
            next()
          })
        })

        async.series(jobs, done)
      })

      it('(happy, by name)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}' + footerTemplate.id + '{{/include}}'
          }).then(function () {
            next()
          }).catch(next)
        })

        jobs.push(function (next) {
          template.render(person, null, null, null, null, function (error, html, view) {
            should.not.exist(error)
            html.should.equal('Hello there, fname | ©' + year)
            next()
          })
        })

        async.series(jobs, done)
      })

      it('(failure; missing)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}MISSING THING{{/include}}'
          }).then(function () {
            next()
          }).catch(next)
        })

        jobs.push(function (next) {
          template.render(person, null, null, null, null, function (error, html, view) {
            error.toString().should.equal('Error: Cannot find template to include (MISSING THING)')
            next()
          })
        })

        async.series(jobs, done)
      })

      it('(failure; self-include)', function (done) {
        var jobs = []

        jobs.push(function (next) {
          template.updateAttributes({
            template: 'Hello there, {{ person.data.firstName }} {{#include}}' + template.id + '{{/include}}'
          }).then(function () {
            next()
          }).catch(next)
        })

        jobs.push(function (next) {
          template.render(person, null, null, null, null, function (error, html, view) {
            error.toString().should.equal('Error: Cannot include template into itself')
            next()
          })
        })

        async.series(jobs, done)
      })
    })
  })
})
