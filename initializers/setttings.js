module.exports = {
  loadPriority: 1001,

  initialize: function(api, next){
    /* Populate Base Settings */

    api.teams.settings.push({
      key: 'client:tracking:web:cookieExpiry',
      value: (1000 * 60 * 60 * 24 * 365), // 1 year
      description: 'How long to store the personId cookie in the browser for (ms)'
    });

    api.teams.settings.push({
      key: 'client:tracking:web:cookieName',
      value: 'MessageBotPersonGuid',
      description: 'What should the cookie that stores the PersonGuid be called?'
    });

    next();
  }
};
