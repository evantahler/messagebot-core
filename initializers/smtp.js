var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = {
  loadPriority:  1000,

  initialize: function(api, next){
    var transporter = nodemailer.createTransport(smtpTransport(api.config.smtp));
    api.smtp = {
      client: transporter
    };

    next();
  },
};