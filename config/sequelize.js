exports.default = {
  sequelize: function(api){
    return {
      'dialect'     : process.env.SEQUELIZE_DIALECT,
      'port'        : parseInt(process.env.SEQUELIZE_PORT),
      'database'    : process.env.SEQUELIZE_DATABASE,
      'host'        : process.env.SEQUELIZE_HOST,
      'username'    : process.env.SEQUELIZE_USER,
      'password'    : process.env.SEQUELIZE_PASSWORD,
      'logging'     : false,
    };
  }
};

exports.test = {
  sequelize: function(api){

    if(['mysql', 'postgres'].indexOf(process.env.SEQUELIZE_DIALECT) >= 0){
      return {
        'dialect'     : process.env.SEQUELIZE_DIALECT,
        'port'        : parseInt(process.env.SEQUELIZE_PORT),
        'database'    : 'messagebot_test',
        'host'        : process.env.SEQUELIZE_HOST,
        'username'    : process.env.SEQUELIZE_USER,
        'password'    : process.env.SEQUELIZE_PASSWORD,
        'logging'     : false,
      };
    }else{
      throw new Error('You will need to manualy configure the Sequelize test database settings for this database');
    }
  }
};
