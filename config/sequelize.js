exports.default = {
  sequelize: function(api){
    return {
      "dialect"     : "mysql",
      "port"        : parseInt( process.env.MYSQL_PORT ),
      "database"    : process.env.MYSQL_DATABASE,
      "host"        : process.env.MYSQL_HOST,
      "username"    : process.env.MYSQL_USER,
      "password"    : process.env.MYSQL_PASS,
      "logging"     : false,
      "toSync"      : false,
    };
  }
};

exports.test = {
  sequelize: function(api){
    return {
      "dialect"     : "mysql",
      "database"    : 'messagebot_test',
      "host"        : '127.0.0.1',
      "username"    : 'root',
      "password"    : null,
      "logging"     : false,
      "toSync"      : false,
    };
  }
};