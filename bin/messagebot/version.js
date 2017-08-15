const path = require('path')

module.exports = {
  name: 'messagebot version',
  description: 'show messagebot version',

  run: function (api, data, next) {
    const pkg = require(path.join(__dirname, '/../../package.json'))
    api.log('Name: ' + pkg.name)
    api.log('Description: ' + pkg.description)
    api.log('Version: ' + pkg.version)

    next(null)
  }
}
