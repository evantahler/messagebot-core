// const should = require('should')
// const path = require('path')
// const specHelper = require(path.join(__dirname, '/../specHelper'))
// let api
//
// describe('integartion:binary', () => {
//   let team
//   let user
//
//   before(() => { api = specHelper.api })
//
//   it('overrides actionheros help with only messagebot help', (done) => {
//     this.timeout(10 * 1000)
//     let command = './node_modules/.bin/actionhero help'
//     api.utils.doShell(command, (error, data) => {
//       should.not.exist(error)
//       data.should.containEql('messagebot help')
//       data.should.containEql('messagebot team create')
//       data.should.containEql('messagebot team edit')
//       data.should.containEql('messagebot teams list')
//       data.should.containEql('messagebot version')
//       data.should.not.containEql('actionhero generate')
//       done()
//     }, true)
//   })
//
//   describe('#help', () => {
//     it('returns the messagebot help', (done) => {
//       this.timeout(10 * 1000)
//       let command = './node_modules/.bin/actionhero messagebot help'
//       api.utils.doShell(command, (error, data) => {
//         should.not.exist(error)
//         data.should.containEql('This method will also create the first user for this team.')
//         data.should.containEql('Deletes a team')
//         done()
//       }, true)
//     })
//   })
//
//   describe('#version', () => {
//     it('returns the version', (done) => {
//       this.timeout(10 * 1000)
//       const pkg = require(path.join(__dirname, '/../../package.json'))
//       let command = './node_modules/.bin/actionhero messagebot version'
//       api.utils.doShell(command, (error, data) => {
//         should.not.exist(error)
//         data.should.containEql(pkg.version)
//         done()
//       }, true)
//     })
//   })
//
//   describe('#teamCreate', () => {
//     it('succeeds', (done) => {
//       this.timeout(15 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team create'
//       command += ' --name AnotherTestTeam'
//       command += ' --trackingDomainRegexp "^.*.app.com$"'
//       command += ' --trackingDomain "http://tracking.app.com"'
//       command += ' --email "admin@app.com"'
//       command += ' --password "password"'
//
//       api.utils.doShell(command, (error, data) => {
//         should.not.exist(error)
//         data.should.containEql('New Team')
//         data.should.containEql('New User')
//         done()
//       }, true)
//     })
//
//     it('succeeds (creating the team)', (done) => {
//       api.models.Team.findOne({where: {name: 'AnotherTestTeam'}}).then((_team) => {
//         _team.trackingDomain.should.equal('http://tracking.app.com')
//         team = _team
//         done()
//       })
//     })
//
//     it('succeeds (creating the user)', (done) => {
//       api.models.User.findOne({where: {teamId: team.id}}).then(function (_user) {
//         _user.email.should.equal('admin@app.com')
//         user = _user
//         done()
//       })
//     })
//
//     it('succeeds (creating the person)', (done) => {
//       api.models.Person.findOne({where: {
//         guid: user.personGuid
//       }}).then((person) => {
//         person.hydrate((error) => {
//           should.not.exist(error)
//           person.data.email.should.equal('admin@app.com')
//           done()
//         })
//       })
//     })
//
//     it('fails (missing params)', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team create'
//       command += ' --name AnotherTestTeam'
//       command += ' --trackingDomain "http://tracking.app.com"'
//       command += ' --email "admin@app.com"'
//       command += ' --password "password"'
//
//       api.utils.doShell(command, (error, data) => {
//         // TODO: We are not getting stderr returned?
//         // error.message.should.containEql('Missing required arguments: trackingDomainRegexp')
//         should.exist(error)
//         done()
//       }, true)
//     })
//
//     it('fails (uniqueness)', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team create'
//       command += ' --name AnotherTestTeam'
//       command += ' --trackingDomainRegexp "^.*.app.com$"'
//       command += ' --trackingDomain "http://tracking.app.com"'
//       command += ' --email "admin@app.com"'
//       command += ' --password "password"'
//
//       api.utils.doShell(command, function (error, data, x) {
//         console.log(error)
//         console.log(data)
//         console.log(x)
//         error.message.should.containEql('Validation error')
//         done()
//       }, true)
//     })
//   })
//
//   describe('#teamEdit', () => {
//     it('succeeds', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team edit'
//       command += ' --id ' + team.id
//       command += ' --name AnotherTestTeamNewName'
//
//       api.utils.doShell(command, (error, data) => {
//         should.not.exist(error)
//         data.should.containEql('AnotherTestTeamNewName')
//         data.should.containEql('http://tracking.app.com')
//         done()
//       }, true)
//     })
//
//     it('fails (uniqueness)', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team edit'
//       command += ' --id ' + team.id
//       command += ' --name TestTeam'
//
//       api.utils.doShell(command, (error, data) => {
//         error.message.should.containEql('Validation error')
//         done()
//       }, true)
//     })
//   })
//
//   describe('#teamsView', () => {
//     it('succeeds', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot teams list'
//
//       api.utils.doShell(command, (error, data) => {
//         should.not.exist(error)
//         data.should.containEql('2 Total Teams')
//         data.should.containEql('TestTeam')
//         data.should.containEql('AnotherTestTeamNewName')
//         done()
//       }, true)
//     })
//   })
//
//   describe('#teamDelete', () => {
//     it('succeeds', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team delete'
//       command += ' --id ' + team.id
//
//       api.utils.doShell(command, (error, data) => {
//         should.not.exist(error)
//         done()
//       }, true)
//     })
//
//     it('succeeds (deletes the team)', (done) => {
//       api.models.Team.findOne({where: {id: team.id}}).then((_team) => {
//         should.not.exist(_team)
//         done()
//       }).catch(done)
//     })
//
//     it('succeeds (deletes the user)', (done) => {
//       api.models.User.findOne({where: {teamId: team.id}}).then(function (_user) {
//         should.not.exist(_user)
//         done()
//       }).catch(done)
//     })
//
//     it('succeeds (deletes the person)', (done) => {
//       api.models.Person.findOne({}).then((person) => {
//         person.hydrate((error) => {
//           should.exist(error)
//           done()
//         })
//       })
//     })
//
//     it('fails (missing team)', (done) => {
//       this.timeout(10 * 1000)
//       let command = ''
//       command += ' NODE_ENV=test'
//       command += ' ./node_modules/.bin/actionhero messagebot team delete'
//       command += ' --id ' + team.id
//
//       api.utils.doShell(command, (error, data) => {
//         error.message.should.containEql('Team not found')
//         done()
//       }, true)
//     })
//   })
// })
