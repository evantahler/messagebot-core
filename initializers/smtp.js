var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = {
  loadPriority:  1000,

  initialize: function(api, next){
    var transporter = nodemailer.createTransport(smtpTransport(api.config.smtp));
    api.smtp = {
      client: transporter,

      send: function(to, from, subject, body, callback){
        var email = {
          from:    from,
          to:      to,
          subject: subject,
          html:    body,
        };

        api.smtp.client.sendMail(email, callback);
      },
    };

    next();
  },
};
