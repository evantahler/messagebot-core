exports.usersList = {
  name:                   'users:list',
  description:            'users:list',
  outputExample:          {},
  middleware:             ['logged-in-session'],

  inputs: {},

  run: function(api, data, next){

    api.models.user.findAll().then(function(users){
      data.response.users = [];
      users.forEach(function(user){
        data.response.users.push(user.apiData(api));
      });

      next();
    }).catch(next);
  }
};
