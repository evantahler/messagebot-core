exports.userRoles = {
  name:                   'users:roles',
  description:            'users:roles',
  outputExample:          {},
  middleware:             ['logged-in-session'],
  inputs:                 {},
  run: function(api, data, next){
    data.response.roles = api.models.user.build().validRoles();
    next();
  }
};

exports.usersList = {
  name:                   'users:list',
  description:            'users:list',
  outputExample:          {},
  middleware:             ['logged-in-session'],

  inputs: {},

  run: function(api, data, next){

    api.models.user.findAll({
      where: { teamId: data.session.teamId },
      order: [['id', 'asc']],
    }).then(function(users){
      data.response.users = [];
      users.forEach(function(user){
        data.response.users.push(user.apiData());
      });

      next();
    }).catch(next);
  }
};
