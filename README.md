# MessageBot.io
*A modern customer relationship and analytics platform*

[![Build Status](https://travis-ci.org/messagebot/messagebot-core.svg)](https://travis-ci.org/messagebot/messagebot-core)

## Requirements

| Software          | Version   |
|-------------------|-----------|
| Node.JS           | >=4.0.0   |
| ElasticSearch     | >=2.0.0   |
| Redis             | >=2.0.0   |
| MySQL || Postgres | "modern"  |

## Install

- `npm install` (this will also run `npm run prepare`, installing needed geolocation databases, kibana, etc)
- `cp .env.example .env`, and adjust according to your system/needs

## Configuration and Running

- Start `redis`
- Start your relational database, IE: `mySQL`
  - be sure to create the database you need for development, IE:
    - (mysql) `mysql -u root -e "crete database messagebot_development"`
    - (postgres) `createdb messagebot_development`
- Start `elasticsearch`
- Configure `.env` with the secrets you need, or ensure that they are already present within the environment
  - ensure that the databases you listed exist and that the user(s) you have configured can reach & access them
- Install any additional database drivers needed for your relational database:
  - `npm install --save pg pg-hstore`
  - `npm install --save mysql`
  - `npm install --save sqlite3`
  - `npm install --save tedious`

`source .env && npm run migrate && npm start`
