var fs = require('fs');

var help = function(api, callback){
  var content = fs.readFileSync(__dirname + '/../support/help.txt').toString();

  var pkg = require(__dirname + '/../../package.json');
  console.log('Name: '        + pkg.name);
  console.log('Description: ' + pkg.description);
  console.log('Version: '     + pkg.version);

  console.log(content);

  return callback();
};

module.exports = help;
