const should = require('should')
const path = require('path')
const specHelper = require(path.join(__dirname, '/../specHelper'))
let api

describe('integartion:binary', () => {
  let team
  let user

  before(() => { api = specHelper.api })

  it('overrides actionheros help with only messagebot help', (done) => {
    let command = 'npx actionhero messagebot help'
    api.utils.doShell(command, (error, data) => {
      should.not.exist(error)
      data.should.containEql('messagebot help')
      data.should.containEql('messagebot team create')
      data.should.containEql('messagebot team edit')
      data.should.containEql('messagebot teams list')
      data.should.containEql('messagebot version')
      data.should.not.containEql('actionhero generate')
      done()
    }, true)
  })

  describe('#help', () => {
    it('returns the messagebot help', (done) => {
      let command = 'npx actionhero messagebot help'
      api.utils.doShell(command, (error, data) => {
        should.not.exist(error)
        data.should.containEql('messagebot team delete')
        data.should.containEql('description: delete a messagebot team')
        done()
      }, true)
    })
  })

  describe('#version', () => {
    it('returns the version', (done) => {
      const pkg = require(path.join(__dirname, '/../../package.json'))
      let command = 'npx actionhero messagebot version'
      api.utils.doShell(command, (error, data) => {
        should.not.exist(error)
        data.should.containEql(`Version: ${pkg.version}`)
        done()
      }, true)
    })
  })

  describe('#teamCreate', () => {
    it('succeeds', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team create'
      command += ' --name AnotherTestTeam'
      command += ' --trackingDomainRegexp "^.*.app.com$"'
      command += ' --trackingDomain "http://tracking.app.com"'
      command += ' --email "admin@app.com"'
      command += ' --password "password"'

      api.utils.doShell(command, (error, data) => {
        should.not.exist(error)
        data.should.containEql('New Team')
        data.should.containEql('New User')
        done()
      }, true)
    }).timeout(15 * 1000)

    it('succeeds (creating the team)', (done) => {
      api.models.Team.findOne({where: {name: 'AnotherTestTeam'}}).then((_team) => {
        _team.trackingDomain.should.equal('http://tracking.app.com')
        team = _team
        done()
      })
    })

    it('succeeds (creating the user)', (done) => {
      api.models.User.findOne({where: {teamGuid: team.guid}}).then(function (_user) {
        _user.email.should.equal('admin@app.com')
        user = _user
        done()
      })
    })

    it('succeeds (creating the person)', (done) => {
      api.models.Person.findOne({where: {
        guid: user.personGuid
      }}).then((person) => {
        person.hydrate((error) => {
          should.not.exist(error)
          person.data.email.should.equal('admin@app.com')
          done()
        })
      })
    })

    it('fails (missing params)', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team create'
      command += ' --name AnotherTestTeam'
      command += ' --trackingDomain "http://tracking.app.com"'
      command += ' --email "admin@app.com"'
      command += ' --password "password"'

      api.utils.doShell(command, (error, data) => {
        // TODO: We are not getting stderr returned?
        // error.message.should.containEql('Missing required arguments: trackingDomainRegexp')
        should.exist(error)
        done()
      }, true)
    })

    it('fails (uniqueness)', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team create'
      command += ' --name AnotherTestTeam'
      command += ' --trackingDomainRegexp "^.*.app.com$"'
      command += ' --trackingDomain "http://tracking.app.com"'
      command += ' --email "admin@app.com"'
      command += ' --password "password"'

      api.utils.doShell(command, function (error, data) {
        error.should.containEql('Validation error')
        done()
      }, true)
    })
  })

  describe('#teamEdit', () => {
    it('succeeds', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team edit'
      command += ' --guid ' + team.guid
      command += ' --name AnotherTestTeamNewName'

      api.utils.doShell(command, (error, data) => {
        should.not.exist(error)
        data.should.containEql('AnotherTestTeamNewName')
        data.should.containEql('http://tracking.app.com')
        done()
      }, true)
    })

    it('fails (uniqueness)', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team edit'
      command += ' --guid ' + team.guid
      command += ' --name TestTeam'

      api.utils.doShell(command, (error, data) => {
        error.should.containEql('Validation error')
        done()
      }, true)
    })
  })

  describe('#teamsView', () => {
    it('succeeds', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot teams list'

      api.utils.doShell(command, (error, data) => {
        should.not.exist(error)
        data.should.containEql('2 Total Teams')
        data.should.containEql('TestTeam')
        data.should.containEql('AnotherTestTeamNewName')
        done()
      }, true)
    })
  })

  describe('#teamDelete', () => {
    it('succeeds', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team delete'
      command += ' --guid ' + team.guid

      api.utils.doShell(command, (error, data) => {
        should.not.exist(error)
        done()
      }, true)
    })

    it('succeeds (deletes the team)', (done) => {
      api.models.Team.findOne({where: {guid: team.guid}}).then((_team) => {
        should.not.exist(_team)
        done()
      }).catch(done)
    })

    it('succeeds (deletes the user)', (done) => {
      api.models.User.findOne({where: {teamGuid: team.guid}}).then(function (_user) {
        should.not.exist(_user)
        done()
      }).catch(done)
    })

    it('succeeds (deletes the person)', (done) => {
      api.models.Person.findOne({where: {teamGuid: team.guid}}).then((person) => {
        should.not.exist(person)
        done()
      })
    })

    it('fails (missing team)', (done) => {
      let command = ''
      command += ' NODE_ENV=test'
      command += ' npx actionhero messagebot team delete'
      command += ' --guid ' + team.guid

      api.utils.doShell(command, (error, data) => {
        error.should.containEql('Team not found')
        done()
      }, true)
    })
  })
})
